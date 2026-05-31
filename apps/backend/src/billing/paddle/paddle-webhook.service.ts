/**
 * Paddle Billing webhook event dispatcher.
 *
 * Receives a parsed Paddle event payload (after signature verification +
 * idempotency check) and updates our domain tables.
 *
 * Reference event types handled:
 *   - transaction.completed              one-time payment captured
 *   - transaction.payment_failed
 *   - subscription.created/updated/activated/past_due/paused/resumed/canceled
 *   - adjustment.created                 refund
 *
 * @see https://developer.paddle.com/webhooks/overview
 */

import pool from '../../db.js';
import {
  resolveOneTimeStockPriceId,
  resolvePaddlePriceToLocal,
  mapPaddleSubscriptionStatus,
} from './paddle-mapping.js';
import { resolvePurchaseTargetFromAsset } from '../purchase-keys.js';
import { upsertOrder, markOrderRefunded } from '../orders.service.js';
import {
  markUserAssetPurchaseRefundedByTransaction,
  upsertUserAssetPurchase,
} from '../user-asset-purchases.service.js';
import {
  upsertSubscription,
  userIdFromProviderSubscription,
} from '../subscriptions.service.js';

const PROVIDER = 'paddle';

interface PaddleEvent {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  notification_id?: string;
  data?: Record<string, any>;
}

interface HandlerOutcome {
  status: 'processed' | 'ignored';
  eventType: string;
  message?: string;
}

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

function asNumberCents(amountString: unknown): number {
  // Paddle returns amounts as strings in "smallest currency unit" (e.g. cents).
  if (typeof amountString === 'number') return Math.trunc(amountString);
  if (typeof amountString === 'string') {
    const n = parseInt(amountString, 10);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function readUserId(customData: any): string | null {
  if (!customData || typeof customData !== 'object') return null;
  const raw = customData.user_id;
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

function readCustomString(customData: any, key: string): string | null {
  if (!customData || typeof customData !== 'object') return null;
  const raw = customData[key];
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

async function ensureUserExists(userId: string): Promise<boolean> {
  const r = await pool.query('SELECT 1 FROM users WHERE id = $1 LIMIT 1', [userId]);
  return r.rows.length > 0;
}

// ---------------------------------------------------------------------------
// transaction.* (one-time orders)
// ---------------------------------------------------------------------------

async function handleTransactionCompleted(event: PaddleEvent): Promise<HandlerOutcome> {
  const tx = event.data;
  if (!tx) throw new Error('transaction.completed missing data');
  const txId = asString(tx.id);
  if (!txId) throw new Error('transaction.completed missing id');

  // Subscription-tier payments emit subscription_created/updated separately —
  // skip duplicate fulfillment for those.
  if (tx.subscription_id) {
    return {
      status: 'ignored',
      eventType: 'transaction.completed',
      message: 'subscription-tier — handled by subscription.* events',
    };
  }

  const userId = readUserId(tx.custom_data);
  if (!userId) {
    throw new Error(
      'transaction.completed missing custom_data.user_id — pass it when creating the transaction.'
    );
  }
  if (!(await ensureUserExists(userId))) {
    throw new Error(`transaction.completed references unknown user_id=${userId}`);
  }

  const items: any[] = Array.isArray(tx.items) ? tx.items : [];
  const firstItem = items[0];
  const priceId = asString(firstItem?.price?.id ?? firstItem?.price_id);
  if (!priceId) {
    throw new Error('transaction.completed: first item has no price_id');
  }

  const stockPrice = resolveOneTimeStockPriceId();
  const mapping = await resolvePaddlePriceToLocal(priceId);
  const isFlagStockPrice = Boolean(stockPrice && stockPrice.priceId === priceId);

  if (!isFlagStockPrice && (!mapping || mapping.kind === 'subscription')) {
    throw new Error(
      `transaction.completed: price ${priceId} is not the configured flag-stock one-time price.`
    );
  }
  if (mapping?.kind === 'subscription') {
    return {
      status: 'ignored',
      eventType: 'transaction.completed',
      message: 'subscription price — handled by subscription.* events',
    };
  }

  const totals = tx.details?.totals ?? tx.totals ?? {};

  const customProductSlug = readCustomString(tx.custom_data, 'product_slug');
  const customAssetGroupKey = readCustomString(tx.custom_data, 'asset_group_key');
  const customAssetId =
    readCustomString(tx.custom_data, 'asset_id') ||
    readCustomString(tx.custom_data, 'file_id');
  const customCountrySlug = readCustomString(tx.custom_data, 'country_slug');

  const purchaseTarget = await resolvePurchaseTargetFromAsset({
    assetGroupKey: customAssetGroupKey,
    assetId: customAssetId,
    fileId: customAssetId,
    assetProductSlug: customProductSlug,
    countrySlug: customCountrySlug,
  });

  if (!purchaseTarget) {
    throw new Error(
      'transaction.completed: missing asset_group_key / asset_id in custom_data — cannot grant access.'
    );
  }

  const orderProductSlug = purchaseTarget.productSlug;

  await upsertOrder({
    user_id: userId,
    provider: PROVIDER,
    provider_order_id: txId,
    provider_customer_id: asString(tx.customer_id),
    provider_variant_id: priceId,
    product_slug: orderProductSlug,
    asset_id: purchaseTarget?.assetId || customAssetId || null,
    amount_cents: asNumberCents(totals.total ?? totals.grand_total ?? 0),
    currency: asString(totals.currency_code ?? tx.currency_code) || 'USD',
    status: 'paid',
    receipt_url: asString(tx.checkout?.url),
    metadata: {
      invoice_number: tx.invoice_number,
      invoice_id: tx.invoice_id,
      occurred_at: event.occurred_at,
      asset_group_key: purchaseTarget?.assetGroupKey ?? null,
    },
  });

  if (purchaseTarget) {
    await upsertUserAssetPurchase({
      user_id: userId,
      asset_group_key: purchaseTarget.assetGroupKey,
      product_slug: purchaseTarget.productSlug,
      asset_id: purchaseTarget.assetId,
      paddle_transaction_id: txId,
      purchase_type: 'one_time',
      status: 'paid',
      purchased_at: event.occurred_at ? new Date(event.occurred_at) : new Date(),
    });
  } else {
    console.warn(
      `[paddle] transaction.completed ${txId}: could not resolve asset_group_key (product_slug=${customProductSlug ?? '—'})`
    );
  }

  return { status: 'processed', eventType: 'transaction.completed' };
}

// ---------------------------------------------------------------------------
// adjustment.created (refund)
// ---------------------------------------------------------------------------

async function handleAdjustment(event: PaddleEvent): Promise<HandlerOutcome> {
  const adj = event.data;
  if (!adj) throw new Error('adjustment.created missing data');

  // Only refund-type adjustments concern us.
  const action = asString(adj.action);
  if (action !== 'refund') {
    return {
      status: 'ignored',
      eventType: 'adjustment.created',
      message: `action=${action}`,
    };
  }

  const txId = asString(adj.transaction_id);
  if (!txId) {
    throw new Error('adjustment.created missing transaction_id');
  }

  // We can't easily tell if this is a partial refund without summing items;
  // mark as refunded — partial refund detection can be added later.
  await markOrderRefunded(PROVIDER, txId, true);
  await markUserAssetPurchaseRefundedByTransaction(txId);
  return { status: 'processed', eventType: 'adjustment.created' };
}

// ---------------------------------------------------------------------------
// subscription.* (recurring)
// ---------------------------------------------------------------------------

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.created',
  'subscription.updated',
  'subscription.activated',
  'subscription.past_due',
  'subscription.paused',
  'subscription.resumed',
  'subscription.canceled',
  'subscription.trialing',
]);

async function handleSubscriptionEvent(
  eventType: string,
  event: PaddleEvent
): Promise<HandlerOutcome> {
  const sub = event.data;
  if (!sub) throw new Error(`${eventType} missing data`);
  const subId = asString(sub.id);
  if (!subId) throw new Error(`${eventType} missing subscription id`);

  // Resolve user via custom_data (preferred) or prior subscription row.
  let userId = readUserId(sub.custom_data);
  if (!userId) {
    userId = await userIdFromProviderSubscription(PROVIDER, subId);
  }
  if (!userId) {
    throw new Error(
      `${eventType} cannot resolve user (no custom_data.user_id and no prior subscription with id=${subId})`
    );
  }
  if (!(await ensureUserExists(userId))) {
    throw new Error(`${eventType} references unknown user_id=${userId}`);
  }

  const items: any[] = Array.isArray(sub.items) ? sub.items : [];
  const primaryItem = items[0];
  const priceId = asString(primaryItem?.price?.id);
  if (!priceId) {
    throw new Error(`${eventType} primary item missing price.id`);
  }
  const productId = asString(primaryItem?.price?.product_id);

  const mapping = await resolvePaddlePriceToLocal(priceId);
  if (!mapping || mapping.kind !== 'subscription') {
    throw new Error(
      `${eventType}: price ${priceId} is not mapped as a subscription plan`
    );
  }

  const paddleStatus = asString(sub.status);
  const mappedStatus = mapPaddleSubscriptionStatus(paddleStatus);

  // current_billing_period or fallback fields.
  const periodStart =
    asString(sub.current_billing_period?.starts_at) ||
    asString(sub.started_at) ||
    asString(sub.created_at) ||
    new Date().toISOString();

  const periodEnd =
    asString(sub.current_billing_period?.ends_at) ||
    asString(sub.next_billed_at) ||
    asString(sub.canceled_at) ||
    new Date(Date.now() + 30 * 86_400_000).toISOString();

  // Scheduled cancellation = cancel_at_period_end semantics for us.
  const scheduled = sub.scheduled_change as Record<string, any> | null | undefined;
  const cancelAtPeriodEnd =
    !!(scheduled && scheduled.action === 'cancel') ||
    !!(sub.canceled_at && mappedStatus === 'active');

  await upsertSubscription({
    user_id: userId,
    plan_slug: mapping.planSlug,
    provider: PROVIDER,
    provider_subscription_id: subId,
    provider_customer_id: asString(sub.customer_id),
    provider_variant_id: priceId,
    provider_order_id: asString(sub.transaction_id),
    provider_status: paddleStatus,
    status: mappedStatus,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    ends_at: asString(sub.canceled_at) || asString(scheduled?.effective_at),
    trial_ends_at: asString(sub.trial_dates?.ends_at),
    pause_starts_at: asString(sub.paused_at),
    pause_resumes_at: asString(scheduled?.resume_at),
    update_payment_method_url: asString(sub.management_urls?.update_payment_method),
    customer_portal_url: asString(sub.management_urls?.cancel),
  });

  // Persist product id alongside (best effort).
  if (productId) {
    await pool.query(
      `UPDATE user_subscriptions
          SET provider_product_id = $1
        WHERE billing_provider = 'paddle'
          AND provider_subscription_id = $2`,
      [productId, subId]
    );
  }

  return { status: 'processed', eventType };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function dispatchPaddleEvent(
  payload: PaddleEvent
): Promise<HandlerOutcome> {
  const type = payload.event_type || '';

  if (type === 'transaction.completed' || type === 'transaction.paid') {
    return handleTransactionCompleted(payload);
  }
  if (type === 'transaction.payment_failed') {
    // Optionally update our orders table to status='failed' for one-offs.
    const txId = asString(payload.data?.id);
    if (txId) {
      await pool.query(
        `UPDATE orders SET status = 'failed', updated_at = CURRENT_TIMESTAMP
          WHERE billing_provider = 'paddle' AND provider_order_id = $1`,
        [txId]
      );
    }
    return { status: 'processed', eventType: type };
  }
  if (type === 'adjustment.created') return handleAdjustment(payload);
  if (SUBSCRIPTION_EVENTS.has(type)) return handleSubscriptionEvent(type, payload);

  return { status: 'ignored', eventType: type || 'unknown', message: 'event not handled' };
}
