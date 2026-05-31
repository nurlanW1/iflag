/**
 * Billing routes (Paddle Billing).
 *
 *   POST /api/billing/checkout                  authenticated — create Paddle checkout
 *   POST /api/billing/subscriptions/cancel      authenticated — cancel at period end
 *   POST /api/billing/subscriptions/resume      authenticated — resume
 *   POST /api/billing/subscriptions/pause       authenticated — pause (resume_at)
 *   POST /api/billing/portal                    authenticated — customer portal URL
 *   GET  /api/billing/orders                    authenticated — one-time purchases
 *   GET  /api/billing/purchased-assets          authenticated — lifetime owned designs
 *   GET  /api/billing/ownership                 authenticated — ?productSlug=&assetGroupKey=
 *   GET  /api/billing/subscription              authenticated — current subscription
 *
 * Webhook is mounted separately in index.ts BEFORE express.json() for signature verification.
 */

import express, { type Request, type Response, type Router } from 'express';
import {
  authenticateAppJwtOrClerkBilling,
  type AuthRequest,
} from '../auth/auth.middleware.js';
import { getUserById } from '../auth/auth.service.js';
import {
  getPaddleConfig,
  requirePaddleConfig,
} from './paddle/paddle.config.js';
import {
  ONE_TIME_STOCK_SLUG,
  resolveOneTimeStockPriceId,
  resolvePaddlePriceForCheckout,
} from './paddle/paddle-mapping.js';
import {
  createTransaction as paddleCreateTransaction,
  cancelSubscription as paddleCancelSubscription,
  pauseSubscription as paddlePauseSubscription,
  resumeSubscription as paddleResumeSubscription,
  getSubscription as paddleGetSubscription,
  pickManagementUrls as paddleManagementUrls,
  PaddleApiError,
} from './paddle/paddle-api.js';
import { verifyPaddleSignature } from './paddle/paddle-signature.js';
import { dispatchPaddleEvent } from './paddle/paddle-webhook.service.js';
import { getUserActiveSubscription } from './subscriptions.service.js';
import { getUserOrders } from './orders.service.js';
import {
  resolvePurchaseTarget,
  resolvePurchaseTargetFromAsset,
  slugFromAssetGroupKey,
} from './purchase-keys.js';
import {
  listUserPurchasedAssets,
  userOwnsAssetGroup,
} from './user-asset-purchases.service.js';
import {
  tryRegisterDelivery,
  markProcessed,
  markFailed,
} from './webhook-idempotency.service.js';
import { createHash } from 'crypto';

const PROVIDER_PADDLE = 'paddle';

function isCheckoutKind(v: unknown): v is 'one_time' | 'subscription' {
  return v === 'one_time' || v === 'subscription';
}

function sendApiError(res: Response, err: any, fallbackStatus = 500) {
  if (err instanceof PaddleApiError) {
    res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({
      error: 'Paddle API error',
      detail: err.message,
      provider_code: err.providerError?.code,
    });
    return;
  }
  if (
    err?.status === 503 &&
    (err?.code === 'BILLING_NOT_CONFIGURED' || err?.code === 'PADDLE_NOT_CONFIGURED')
  ) {
    res.status(503).json({ error: err.message, code: err.code });
    return;
  }
  console.error('[billing] route error:', err);
  res.status(fallbackStatus).json({ error: err?.message || 'Billing error' });
}

const router: Router = express.Router();

router.use(authenticateAppJwtOrClerkBilling);

router.post('/checkout', async (req: AuthRequest, res: Response) => {
  try {
    const {
      kind,
      planSlug,
      productSlug,
      assetGroupKey,
      assetId,
      fileId,
      assetProductSlug,
      countrySlug,
    } = req.body || {};

    if (!isCheckoutKind(kind)) {
      return res.status(400).json({ error: 'kind must be "subscription" or "one_time"' });
    }
    if (kind === 'subscription' && !planSlug) {
      return res.status(400).json({ error: 'planSlug is required for subscription checkout' });
    }

    const user = await getUserById(req.user!.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    let oneTimeTarget: Awaited<ReturnType<typeof resolvePurchaseTargetFromAsset>> = null;
    if (kind === 'one_time') {
      const ag = assetGroupKey ? String(assetGroupKey) : null;
      const aid = assetId ? String(assetId) : null;
      const fid = fileId ? String(fileId) : null;
      let mslug = assetProductSlug ? String(assetProductSlug).trim() : '';
      const legacySlug = productSlug ? String(productSlug).trim() : '';
      // Legacy clients sent marketplace slug as productSlug (not flag-stock).
      if (!mslug && legacySlug && legacySlug !== ONE_TIME_STOCK_SLUG) {
        mslug = legacySlug;
      }

      if (!ag?.trim() && !aid?.trim() && !fid?.trim() && !mslug) {
        return res.status(400).json({
          error:
            'assetGroupKey, assetId, or assetProductSlug is required for one_time checkout.',
        });
      }

      oneTimeTarget = await resolvePurchaseTargetFromAsset({
        assetGroupKey: ag,
        assetId: aid,
        fileId: fid,
        assetProductSlug: mslug,
        countrySlug: countrySlug ? String(countrySlug) : null,
      });
      if (!oneTimeTarget) {
        return res.status(400).json({
          error: 'Unknown asset — could not resolve design for checkout.',
          assetGroupKey: ag,
          assetId: aid,
          assetProductSlug: mslug,
        });
      }

      const alreadyOwned = await userOwnsAssetGroup(
        user.id,
        oneTimeTarget.assetGroupKey,
        oneTimeTarget.productSlug
      );
      if (alreadyOwned) {
        return res.json({
          alreadyPurchased: true,
          ownsProduct: true,
          productSlug: oneTimeTarget.productSlug,
          assetGroupKey: oneTimeTarget.assetGroupKey,
        });
      }
    }

    const cfg = requirePaddleConfig();

    let resolved: Awaited<ReturnType<typeof resolvePaddlePriceForCheckout>> = null;
    if (kind === 'one_time') {
      const stock = resolveOneTimeStockPriceId();
      if (!stock) {
        return res.status(400).json({
          error: 'Paddle one-time price for flag-stock is not configured',
          code: 'PADDLE_FLAG_STOCK_PRICE_MISSING',
          productSlug: ONE_TIME_STOCK_SLUG,
        });
      }
      resolved = {
        kind: 'one_time',
        productSlug: ONE_TIME_STOCK_SLUG,
        priceId: stock.priceId,
      };
    } else {
      resolved = await resolvePaddlePriceForCheckout({
        kind,
        planSlug: planSlug || null,
        productSlug: productSlug || null,
      });
      if (!resolved) {
        return res.status(400).json({
          error: `No Paddle price mapped for plan "${planSlug}".`,
          planSlug,
        });
      }
    }

    const tx = await paddleCreateTransaction(cfg, {
      items: [{ price_id: resolved.priceId, quantity: 1 }],
      customerEmail: user.email,
      customerName: user.full_name ?? undefined,
      customData: {
        user_id: user.id,
        user_email: user.email,
        kind: resolved.kind,
        ...(resolved.kind === 'subscription'
          ? { plan_slug: resolved.planSlug }
          : {
              paddle_product_slug: ONE_TIME_STOCK_SLUG,
              product_slug: oneTimeTarget!.productSlug,
              asset_group_key: oneTimeTarget!.assetGroupKey,
              asset_id: oneTimeTarget!.assetId,
              country_slug: countrySlug ? String(countrySlug).trim().toLowerCase() : null,
              file_id: fileId ? String(fileId).trim() : oneTimeTarget!.assetId,
            }),
      },
    });

    return res.json({
      provider: 'paddle',
      transaction_id: tx.id,
      url: tx.checkout?.url ?? null,
      status: tx.status,
      alreadyPurchased: false,
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.get('/ownership', async (req: AuthRequest, res: Response) => {
  try {
    const productSlug = String(req.query.productSlug ?? '').trim();
    const assetGroupKey = String(req.query.assetGroupKey ?? '').trim() || null;

    if (!productSlug && !assetGroupKey) {
      return res.status(400).json({ error: 'productSlug or assetGroupKey is required' });
    }

    const target = productSlug
      ? await resolvePurchaseTarget({ productSlug, assetGroupKey })
      : assetGroupKey
        ? {
            assetGroupKey: assetGroupKey.toLowerCase(),
            productSlug: slugFromAssetGroupKey(assetGroupKey),
            assetId: null,
          }
        : null;

    if (!target) {
      return res.json({ ownsProduct: false, alreadyPurchased: false });
    }

    const owns = await userOwnsAssetGroup(
      req.user!.userId,
      target.assetGroupKey,
      target.productSlug
    );

    return res.json({
      ownsProduct: owns,
      alreadyPurchased: owns,
      productSlug: target.productSlug,
      assetGroupKey: target.assetGroupKey,
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.get('/purchased-assets', async (req: AuthRequest, res: Response) => {
  try {
    const assets = await listUserPurchasedAssets(req.user!.userId);
    return res.json({ assets });
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.post('/subscriptions/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    if (sub.billing_provider !== PROVIDER_PADDLE) {
      return res.status(410).json({
        error:
          'This subscription uses a retired billing provider. Subscribe again from the pricing page (Paddle).',
      });
    }

    const cfg = requirePaddleConfig();
    const updated = await paddleCancelSubscription(
      cfg,
      sub.provider_subscription_id,
      'next_billing_period'
    );
    return res.json({
      ok: true,
      status: updated.status,
      ends_at: updated.canceled_at ?? updated.scheduled_change?.effective_at ?? null,
      message: 'Subscription will remain active until the end of the current period.',
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.post('/subscriptions/resume', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No subscription to resume' });
    }
    if (sub.billing_provider !== PROVIDER_PADDLE) {
      return res.status(410).json({
        error:
          'This subscription uses a retired billing provider. Subscribe again from the pricing page (Paddle).',
      });
    }

    const cfg = requirePaddleConfig();
    const updated = await paddleResumeSubscription(cfg, sub.provider_subscription_id);
    return res.json({
      ok: true,
      status: updated.status,
      next_billed_at: updated.next_billed_at ?? null,
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.post('/subscriptions/pause', async (req: AuthRequest, res: Response) => {
  try {
    const { resumes_at } = req.body || {};
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No active subscription to pause' });
    }
    if (sub.billing_provider !== PROVIDER_PADDLE) {
      return res.status(410).json({
        error:
          'This subscription uses a retired billing provider. Subscribe again from the pricing page (Paddle).',
      });
    }

    const cfg = requirePaddleConfig();
    const updated = await paddlePauseSubscription(
      cfg,
      sub.provider_subscription_id,
      typeof resumes_at === 'string' ? resumes_at : undefined
    );
    return res.json({
      ok: true,
      status: updated.status,
      paused_at: updated.paused_at ?? null,
      scheduled_change: updated.scheduled_change ?? null,
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.post('/portal', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No active subscription to manage' });
    }
    if (sub.customer_portal_url) {
      return res.json({ url: sub.customer_portal_url });
    }
    if (sub.billing_provider !== PROVIDER_PADDLE) {
      return res.status(410).json({
        error:
          'This subscription uses a retired billing provider. Manage billing via Paddle for new subscriptions.',
      });
    }

    const cfg = requirePaddleConfig();
    const remote = await paddleGetSubscription(cfg, sub.provider_subscription_id);
    const urls = paddleManagementUrls(remote);
    const url = urls.updatePaymentMethod || urls.cancel;
    if (!url) {
      return res.status(502).json({ error: 'Customer portal URL not available' });
    }
    return res.json({ url });
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await getUserOrders(req.user!.userId, { page, limit });
    return res.json(result);
  } catch (err) {
    return sendApiError(res, err);
  }
});

router.get('/subscription', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    return res.json({ subscription: sub });
  } catch (err) {
    return sendApiError(res, err);
  }
});

export default router;

export async function paddleWebhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  const cfg = getPaddleConfig();
  if (!cfg) {
    res.status(503).json({ error: 'Paddle webhook not configured' });
    return;
  }

  const rawBuffer: Buffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : '', 'utf8');

  const sigHeader =
    (req.headers['paddle-signature'] as string | undefined) ||
    (req.headers['Paddle-Signature'] as unknown as string | undefined);

  const verify = verifyPaddleSignature(rawBuffer, sigHeader || null, cfg.webhookSecret);
  if (!verify.valid) {
    res.status(401).json({
      error: 'Invalid signature',
      reason: verify.reason,
    });
    return;
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBuffer.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  const idempotencyKey =
    payload?.notification_id || payload?.event_id || null;
  if (!idempotencyKey) {
    res.status(400).json({
      error: 'Payload missing notification_id or event_id for idempotency',
    });
    return;
  }

  const payloadHash = createHash('sha256').update(rawBuffer).digest('hex');

  const delivery = await tryRegisterDelivery({
    provider: PROVIDER_PADDLE,
    idempotencyKey,
    eventName: payload?.event_type,
    resourceType: payload?.data?.id ? guessResourceType(payload.data.id) : undefined,
    resourceId: payload?.data?.id ? String(payload.data.id) : undefined,
    signature: sigHeader || undefined,
    payloadHash,
  });

  if (delivery.isDuplicate) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  try {
    const outcome = await dispatchPaddleEvent(payload);
    await markProcessed(delivery.id);
    res.status(200).json({ received: true, ...outcome });
  } catch (err: any) {
    const errMsg = err?.message || 'webhook processing failed';
    console.error('[billing] paddle webhook processing failed:', errMsg, err);
    await markFailed(delivery.id, errMsg).catch(() => {});
    res.status(500).json({ error: errMsg });
  }
}

function guessResourceType(id: string): string | undefined {
  if (typeof id !== 'string') return undefined;
  const m = id.match(/^([a-z]+)_/);
  return m ? m[1] : undefined;
}
