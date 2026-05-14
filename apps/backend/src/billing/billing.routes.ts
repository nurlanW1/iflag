/**
 * Billing routes (Lemon Squeezy).
 *
 *   POST /api/billing/checkout                  authenticated — create LS hosted checkout
 *   POST /api/billing/subscriptions/cancel      authenticated — cancel current sub (at period end)
 *   POST /api/billing/subscriptions/resume      authenticated — resume a cancelled sub
 *   POST /api/billing/subscriptions/pause       authenticated — pause a sub (LS pause API)
 *   POST /api/billing/portal                    authenticated — return LS customer portal URL
 *   GET  /api/billing/orders                    authenticated — list one-time purchases
 *   GET  /api/billing/subscription              authenticated — current sub (provider-aware)
 *
 * Webhook is mounted separately in index.ts BEFORE express.json() so we can
 * verify the HMAC against the raw body. See `mountWebhookRoute` below.
 */

import express, { type Request, type Response, type Router } from 'express';
import {
  authenticateToken,
  type AuthRequest,
} from '../auth/auth.middleware.js';
import { getUserById } from '../auth/auth.service.js';
// Lemon Squeezy (kept available — DB schema is multi-provider).
import {
  requireLemonSqueezyConfig,
  getLemonSqueezyConfig,
} from './lemonsqueezy-config.js';
import { resolveCheckoutVariant } from './lemonsqueezy-mapping.js';
import {
  createCheckout,
  cancelSubscription as lsCancelSubscription,
  resumeSubscription as lsResumeSubscription,
  pauseSubscription as lsPauseSubscription,
  getSubscription as lsGetSubscription,
  pickCustomerPortalUrl,
  pickUpdatePaymentMethodUrl,
  LemonSqueezyApiError,
} from './lemonsqueezy-api.js';
// Paddle Billing (active provider for Uzbekistan).
import {
  getPaddleConfig,
  requirePaddleConfig,
} from './paddle/paddle.config.js';
import { resolvePaddlePriceForCheckout } from './paddle/paddle-mapping.js';
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
// Shared
import {
  getUserActiveSubscription,
} from './subscriptions.service.js';
import { getUserOrders } from './orders.service.js';
import { verifyLemonSqueezySignature } from './lemonsqueezy-signature.js';
import {
  tryRegisterDelivery,
  markProcessed,
  markFailed,
  buildLemonSqueezyIdempotencyKey,
} from './webhook-idempotency.service.js';
import { dispatchLemonSqueezyEvent } from './webhook.service.js';
import { createHash } from 'crypto';

const PROVIDER_LS = 'lemonsqueezy';
const PROVIDER_PADDLE = 'paddle';

/**
 * Active provider for new checkouts. Reads from env so it can be flipped
 * without code changes. Defaults to paddle (Uzbekistan-compatible).
 */
function getActiveProvider(): 'paddle' | 'lemonsqueezy' {
  const v = process.env.BILLING_PROVIDER?.trim().toLowerCase();
  if (v === 'lemonsqueezy' || v === 'paddle') return v;
  return 'paddle';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isCheckoutKind(v: unknown): v is 'one_time' | 'subscription' {
  return v === 'one_time' || v === 'subscription';
}

function sendApiError(res: Response, err: any, fallbackStatus = 500) {
  if (err instanceof LemonSqueezyApiError) {
    res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({
      error: 'Lemon Squeezy API error',
      detail: err.message,
    });
    return;
  }
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

// ---------------------------------------------------------------------------
// Authenticated router
// ---------------------------------------------------------------------------

const router: Router = express.Router();

router.use(authenticateToken);

/**
 * POST /api/billing/checkout
 * body: { kind: 'subscription' | 'one_time', planSlug?, productSlug?, provider? }
 *
 * Dispatches to the active provider. If `provider` is supplied, use it;
 * otherwise fall back to BILLING_PROVIDER env (default: paddle).
 */
router.post('/checkout', async (req: AuthRequest, res: Response) => {
  try {
    const { kind, planSlug, productSlug, provider: requestedProvider } =
      req.body || {};

    if (!isCheckoutKind(kind)) {
      return res.status(400).json({ error: 'kind must be "subscription" or "one_time"' });
    }
    if (kind === 'subscription' && !planSlug) {
      return res.status(400).json({ error: 'planSlug is required for subscription checkout' });
    }
    if (kind === 'one_time' && !productSlug) {
      return res.status(400).json({ error: 'productSlug is required for one_time checkout' });
    }

    const user = await getUserById(req.user!.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const provider: 'paddle' | 'lemonsqueezy' =
      requestedProvider === 'lemonsqueezy' || requestedProvider === 'paddle'
        ? requestedProvider
        : getActiveProvider();

    if (provider === 'paddle') {
      const cfg = requirePaddleConfig();
      const resolved = await resolvePaddlePriceForCheckout({
        kind,
        planSlug: planSlug || null,
        productSlug: productSlug || null,
      });
      if (!resolved) {
        return res.status(400).json({
          error:
            'No Paddle price mapped for this plan/product. ' +
            'Configure PADDLE_PRICE_MAP_JSON or set provider_variant_id on subscription_plans.',
        });
      }

      const tx = await paddleCreateTransaction(cfg, {
        items: [{ price_id: resolved.priceId, quantity: 1 }],
        customerEmail: user.email,
        customerName: user.full_name ?? undefined,
        customData: {
          user_id: user.id,
          kind: resolved.kind,
          ...(resolved.kind === 'subscription'
            ? { plan_slug: resolved.planSlug }
            : { product_slug: resolved.productSlug }),
        },
      });

      return res.json({
        provider: 'paddle',
        transaction_id: tx.id,
        url: tx.checkout?.url ?? null,
        status: tx.status,
      });
    }

    // Lemon Squeezy fallback
    const cfg = requireLemonSqueezyConfig();
    const resolved = await resolveCheckoutVariant({
      kind,
      planSlug: planSlug || null,
      productSlug: productSlug || null,
    });
    if (!resolved) {
      return res.status(400).json({
        error:
          'No Lemon Squeezy variant mapped for this plan/product. ' +
          'Configure LEMONSQUEEZY_VARIANT_MAP_JSON or set provider_variant_id on subscription_plans.',
      });
    }
    const { checkoutUrl, expiresAt } = await createCheckout(cfg, {
      variantId: resolved.variantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.full_name ?? undefined,
      customData: {
        kind: resolved.kind,
        ...(resolved.kind === 'subscription'
          ? { plan_slug: resolved.planSlug }
          : { product_slug: resolved.productSlug }),
      },
    });
    return res.json({
      provider: 'lemonsqueezy',
      url: checkoutUrl,
      expires_at: expiresAt,
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

/**
 * POST /api/billing/subscriptions/cancel
 * Cancels at period end. Dispatches based on the subscription's recorded provider.
 */
router.post('/subscriptions/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    if (sub.billing_provider === PROVIDER_PADDLE) {
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
    }

    // Lemon Squeezy
    const cfg = requireLemonSqueezyConfig();
    const updated = await lsCancelSubscription(cfg, sub.provider_subscription_id);
    return res.json({
      ok: true,
      status: updated.attributes?.status,
      ends_at: updated.attributes?.ends_at ?? null,
      message: 'Subscription will remain active until the end of the current period.',
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

/**
 * POST /api/billing/subscriptions/resume
 * Resumes a cancelled (or paused) subscription.
 */
router.post('/subscriptions/resume', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No subscription to resume' });
    }

    if (sub.billing_provider === PROVIDER_PADDLE) {
      const cfg = requirePaddleConfig();
      const updated = await paddleResumeSubscription(cfg, sub.provider_subscription_id);
      return res.json({
        ok: true,
        status: updated.status,
        next_billed_at: updated.next_billed_at ?? null,
      });
    }

    const cfg = requireLemonSqueezyConfig();
    if (!sub.cancel_at_period_end) {
      return res.status(400).json({ error: 'Subscription is not cancelled' });
    }
    const updated = await lsResumeSubscription(cfg, sub.provider_subscription_id);
    return res.json({
      ok: true,
      status: updated.attributes?.status,
      renews_at: updated.attributes?.renews_at ?? null,
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

/**
 * POST /api/billing/subscriptions/pause
 * body: { mode?: 'void' | 'free', resumes_at?: ISO timestamp }
 *   - Paddle uses `resume_at`; mode is LS-specific (kept for compat).
 */
router.post('/subscriptions/pause', async (req: AuthRequest, res: Response) => {
  try {
    const { mode, resumes_at } = req.body || {};
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No active subscription to pause' });
    }

    if (sub.billing_provider === PROVIDER_PADDLE) {
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
    }

    const cfg = requireLemonSqueezyConfig();
    const pauseMode: 'void' | 'free' = mode === 'free' ? 'free' : 'void';
    const updated = await lsPauseSubscription(
      cfg,
      sub.provider_subscription_id,
      pauseMode,
      typeof resumes_at === 'string' ? resumes_at : undefined
    );
    return res.json({
      ok: true,
      status: updated.attributes?.status,
      pause: updated.attributes?.pause ?? null,
    });
  } catch (err) {
    return sendApiError(res, err);
  }
});

/**
 * POST /api/billing/portal
 * Returns a customer portal / payment-method update URL for the user's
 * active subscription. Provider-aware.
 */
router.post('/portal', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    if (!sub || !sub.provider_subscription_id) {
      return res.status(404).json({ error: 'No active subscription to manage' });
    }
    if (sub.customer_portal_url) {
      return res.json({ url: sub.customer_portal_url });
    }

    if (sub.billing_provider === PROVIDER_PADDLE) {
      const cfg = requirePaddleConfig();
      const remote = await paddleGetSubscription(cfg, sub.provider_subscription_id);
      const urls = paddleManagementUrls(remote);
      const url = urls.updatePaymentMethod || urls.cancel;
      if (!url) {
        return res.status(502).json({ error: 'Customer portal URL not available' });
      }
      return res.json({ url });
    }

    const cfg = requireLemonSqueezyConfig();
    const remote = await lsGetSubscription(cfg, sub.provider_subscription_id);
    const portalUrl = pickCustomerPortalUrl(remote);
    const paymentUrl = pickUpdatePaymentMethodUrl(remote);
    const url = portalUrl || paymentUrl;
    if (!url) {
      return res.status(502).json({ error: 'Customer portal URL not available' });
    }
    return res.json({ url });
  } catch (err) {
    return sendApiError(res, err);
  }
});

/**
 * GET /api/billing/orders?page=1&limit=20
 * List authenticated user's one-time purchases.
 */
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

/**
 * GET /api/billing/subscription
 * Current subscription (provider-aware fields).
 */
router.get('/subscription', async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getUserActiveSubscription(req.user!.userId);
    return res.json({ subscription: sub });
  } catch (err) {
    return sendApiError(res, err);
  }
});

export default router;

// ---------------------------------------------------------------------------
// Webhook handlers (mounted separately in index.ts — need raw body, no auth)
// ---------------------------------------------------------------------------

/**
 * Express handler for the Lemon Squeezy webhook.
 *
 * Mount with `express.raw({ type: 'any-mime' })` BEFORE `express.json()` to
 * preserve the exact byte sequence for HMAC verification.
 *
 *   app.post('/api/billing/webhook/lemonsqueezy',
 *     express.raw({ type: 'wildcard', limit: '5mb' }),
 *     lemonSqueezyWebhookHandler);
 */
export async function lemonSqueezyWebhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  const cfg = getLemonSqueezyConfig();
  if (!cfg) {
    res.status(503).json({ error: 'Billing webhook not configured' });
    return;
  }

  // express.raw delivers a Buffer; some proxies might forward a string.
  const rawBuffer: Buffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : '', 'utf8');

  const signature =
    (req.headers['x-signature'] as string | undefined) ||
    (req.headers['X-Signature'] as unknown as string | undefined);

  if (!verifyLemonSqueezySignature(rawBuffer, signature || null, cfg.signingSecret)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBuffer.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  const idempotencyKey = buildLemonSqueezyIdempotencyKey(payload);
  if (!idempotencyKey) {
    res.status(400).json({ error: 'Payload missing event metadata for idempotency key' });
    return;
  }

  const payloadHash = createHash('sha256').update(rawBuffer).digest('hex');

  const delivery = await tryRegisterDelivery({
    provider: PROVIDER_LS,
    idempotencyKey,
    eventName: payload?.meta?.event_name,
    resourceType: payload?.data?.type,
    resourceId: payload?.data?.id ? String(payload.data.id) : undefined,
    signature: signature || undefined,
    payloadHash,
  });

  if (delivery.isDuplicate) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  try {
    const outcome = await dispatchLemonSqueezyEvent(payload);
    await markProcessed(delivery.id);
    res.status(200).json({ received: true, ...outcome });
  } catch (err: any) {
    const errMsg = err?.message || 'webhook processing failed';
    console.error('[billing] webhook processing failed:', errMsg, err);
    await markFailed(delivery.id, errMsg).catch(() => {});
    // 500 → LS will retry with exponential backoff (up to ~3 days).
    res.status(500).json({ error: errMsg });
  }
}

/**
 * Paddle Billing webhook handler.
 *
 * Mount in index.ts BEFORE express.json():
 *
 *   app.post('/api/billing/webhook/paddle',
 *     express.raw({ type: 'any-mime', limit: '5mb' }),
 *     paddleWebhookHandler);
 *
 * Signature format: `Paddle-Signature: ts=<unix>;h1=<hex_hmac_sha256>`
 * where the HMAC is computed over `${ts}:${rawBody}` with the endpoint secret.
 */
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

  // Idempotency: Paddle sends a unique `notification_id` per delivery (it can
  // be retried). We also include event_id for safety.
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

/** Derive a coarse resource-type label from a Paddle id prefix. */
function guessResourceType(id: string): string | undefined {
  if (typeof id !== 'string') return undefined;
  const m = id.match(/^([a-z]+)_/);
  return m ? m[1] : undefined;
}
