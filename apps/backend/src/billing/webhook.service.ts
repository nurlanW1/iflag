/**
 * Lemon Squeezy webhook event dispatcher.
 *
 * Receives a parsed payload (after signature verification + idempotency check)
 * and updates our domain tables: `orders`, `user_subscriptions`.
 *
 * Reference event names:
 *   order_created, order_refunded
 *   subscription_created, subscription_updated, subscription_resumed,
 *   subscription_unpaused, subscription_cancelled, subscription_expired,
 *   subscription_paused, subscription_payment_success,
 *   subscription_payment_recovered, subscription_payment_failed, license_*
 *
 * @see https://docs.lemonsqueezy.com/help/webhooks
 */

import pool from '../db.js';
import {
  resolveVariantToLocal,
  mapLemonStatus,
} from './lemonsqueezy-mapping.js';
import { upsertOrder, markOrderRefunded } from './orders.service.js';
import {
  upsertSubscription,
  userIdFromProviderSubscription,
} from './subscriptions.service.js';

const PROVIDER = 'lemonsqueezy';

interface LsWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

interface HandlerOutcome {
  status: 'processed' | 'ignored';
  eventName: string;
  message?: string;
}

function readCustomUserId(payload: LsWebhookPayload): string | null {
  const raw = payload.meta?.custom_data?.user_id;
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

function asNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

async function ensureUserExists(userId: string): Promise<boolean> {
  const r = await pool.query('SELECT 1 FROM users WHERE id = $1 LIMIT 1', [userId]);
  return r.rows.length > 0;
}

// ---------------------------------------------------------------------------
// One-time orders
// ---------------------------------------------------------------------------

async function handleOrderCreated(payload: LsWebhookPayload): Promise<HandlerOutcome> {
  const attrs = payload.data?.attributes;
  const lsOrderId = payload.data?.id;
  if (!lsOrderId) throw new Error('order_created missing data.id');

  const status = asString(attrs?.status);
  if (status !== 'paid') {
    return { status: 'ignored', eventName: 'order_created', message: `status=${status}` };
  }

  const userId = readCustomUserId(payload);
  if (!userId) {
    throw new Error('order_created missing meta.custom_data.user_id — set it at checkout time');
  }
  if (!(await ensureUserExists(userId))) {
    throw new Error(`order_created references unknown user_id=${userId}`);
  }

  const firstItem = attrs?.first_order_item as Record<string, unknown> | undefined;
  const variantId = firstItem ? asString(firstItem.variant_id) : null;
  if (!variantId) throw new Error('order_created missing first_order_item.variant_id');

  const mapping = await resolveVariantToLocal(variantId);
  if (!mapping) {
    throw new Error(
      `order_created has unmapped variant_id=${variantId}. ` +
        `Add it to LEMONSQUEEZY_VARIANT_MAP_JSON or subscription_plans.provider_variant_id.`
    );
  }

  // Subscription-tier first payments also emit subscription_* events: skip duplicate fulfillment.
  if (mapping.kind === 'subscription') {
    return {
      status: 'ignored',
      eventName: 'order_created',
      message: 'subscription-tier order — handled by subscription_created event',
    };
  }

  await upsertOrder({
    user_id: userId,
    provider: PROVIDER,
    provider_order_id: String(lsOrderId),
    provider_customer_id: asString(attrs?.customer_id),
    provider_variant_id: variantId,
    product_slug: mapping.productSlug,
    amount_cents: asNumber(attrs?.total),
    currency: asString(attrs?.currency) || 'USD',
    status: 'paid',
    receipt_url: asString(attrs?.urls && (attrs.urls as any).receipt) || null,
    metadata: {
      identifier: asString(attrs?.identifier),
      order_number: attrs?.order_number,
      user_email: asString(attrs?.user_email),
    },
  });

  return { status: 'processed', eventName: 'order_created' };
}

async function handleOrderRefunded(payload: LsWebhookPayload): Promise<HandlerOutcome> {
  const lsOrderId = payload.data?.id;
  if (!lsOrderId) throw new Error('order_refunded missing data.id');

  const attrs = payload.data?.attributes;
  const refundedAmount = asNumber(attrs?.refunded);
  const total = asNumber(attrs?.total);
  const fullRefund = refundedAmount > 0 ? refundedAmount >= total : true;

  await markOrderRefunded(PROVIDER, String(lsOrderId), fullRefund);
  return { status: 'processed', eventName: 'order_refunded' };
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

async function handleSubscriptionEvent(
  eventName: string,
  payload: LsWebhookPayload
): Promise<HandlerOutcome> {
  const attrs = payload.data?.attributes;
  const lsSubId = payload.data?.id;
  if (!lsSubId) throw new Error(`${eventName} missing data.id`);

  // user_id resolution: prefer meta.custom_data.user_id; else look up existing sub.
  let userId = readCustomUserId(payload);
  if (!userId) {
    userId = await userIdFromProviderSubscription(PROVIDER, String(lsSubId));
  }
  if (!userId) {
    throw new Error(
      `${eventName} cannot resolve user (no meta.custom_data.user_id and no prior subscription row for id=${lsSubId})`
    );
  }
  if (!(await ensureUserExists(userId))) {
    throw new Error(`${eventName} references unknown user_id=${userId}`);
  }

  const variantId = asString(attrs?.variant_id);
  if (!variantId) throw new Error(`${eventName} missing variant_id`);

  const mapping = await resolveVariantToLocal(variantId);
  if (!mapping || mapping.kind !== 'subscription') {
    throw new Error(`${eventName}: variant_id=${variantId} is not mapped as a subscription plan`);
  }

  const lsStatus = asString(attrs?.status);
  const cancelled = Boolean(attrs?.cancelled);
  const mappedStatus = mapLemonStatus(lsStatus);

  const periodStart =
    asString(attrs?.created_at) || new Date().toISOString();
  let periodEnd =
    asString(attrs?.renews_at) ||
    asString(attrs?.ends_at) ||
    asString(attrs?.trial_ends_at);
  if (!periodEnd) {
    // Fallback: 30 days from now (rare; LS always sends renews_at for active subs).
    periodEnd = new Date(Date.now() + 30 * 86_400_000).toISOString();
  }

  // cancel_at_period_end is true when LS reports cancelled=true but the sub
  // is still active until renews_at/ends_at.
  const cancelAtPeriodEnd =
    cancelled && (mappedStatus === 'active' || mappedStatus === 'trialing');

  const pause = attrs?.pause as Record<string, unknown> | null | undefined;

  await upsertSubscription({
    user_id: userId,
    plan_slug: mapping.planSlug,
    provider: PROVIDER,
    provider_subscription_id: String(lsSubId),
    provider_customer_id: asString(attrs?.customer_id),
    provider_variant_id: variantId,
    provider_order_id: asString(attrs?.order_id),
    provider_status: lsStatus,
    status: mappedStatus,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    ends_at: asString(attrs?.ends_at),
    trial_ends_at: asString(attrs?.trial_ends_at),
    pause_starts_at: pause ? asString(pause.starts_at) : null,
    pause_resumes_at: pause ? asString(pause.resumes_at) : null,
    update_payment_method_url:
      asString((attrs?.urls as any)?.update_payment_method) ||
      asString(attrs?.update_payment_method),
    customer_portal_url: asString((attrs?.urls as any)?.customer_portal),
  });

  return { status: 'processed', eventName };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const SUBSCRIPTION_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_resumed',
  'subscription_unpaused',
  'subscription_payment_success',
  'subscription_payment_recovered',
  'subscription_cancelled',
  'subscription_expired',
  'subscription_paused',
  'subscription_payment_failed',
]);

/**
 * Dispatch a LS webhook payload. Throws on data errors so the route can mark
 * the delivery as failed and return 500 (LS will retry).
 */
export async function dispatchLemonSqueezyEvent(
  payload: LsWebhookPayload
): Promise<HandlerOutcome> {
  const eventName = payload.meta?.event_name || '';

  if (eventName === 'order_created') return handleOrderCreated(payload);
  if (eventName === 'order_refunded') return handleOrderRefunded(payload);
  if (SUBSCRIPTION_EVENTS.has(eventName)) {
    return handleSubscriptionEvent(eventName, payload);
  }

  // Acknowledge unhandled events so LS does not retry indefinitely.
  return {
    status: 'ignored',
    eventName: eventName || 'unknown',
    message: 'event type not handled',
  };
}
