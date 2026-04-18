import {
  fulfillOneTimeOrderFromLemonSqueezy,
  markOrderRefundedByLemonId,
  mapLsSubscriptionStatus,
  upsertSubscriptionFromLemonSqueezy,
} from '@/services/marketplace/commerce-repository';
import { getMarketplaceStore } from '@/services/marketplace/memory-store';
import { resolveMappingForLemonVariantId } from '@/lib/billing/lemonsqueezy-mapping';

type LsMeta = {
  event_name?: string;
  custom_data?: Record<string, string | number | boolean | null | undefined>;
};

type LsWebhookPayload = {
  meta?: LsMeta;
  data?: {
    type?: string;
    id?: string;
    attributes?: Record<string, unknown>;
  };
};

function readUserId(meta: LsMeta | undefined): string | null {
  const raw = meta?.custom_data?.user_id;
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

function userIdFromMetaOrExistingSubscription(
  meta: LsMeta | undefined,
  lemonSubscriptionId: string
): string | null {
  const fromMeta = readUserId(meta);
  if (fromMeta) return fromMeta;
  const sub = getMarketplaceStore().subscriptions.find(
    (s) => s.lemonSqueezyId === lemonSubscriptionId
  );
  return sub?.userId ?? null;
}

function firstOrderItemVariantId(attrs: Record<string, unknown> | undefined): string | null {
  const item = attrs?.first_order_item as Record<string, unknown> | undefined;
  if (!item) return null;
  const vid = item.variant_id;
  if (vid === undefined || vid === null) return null;
  return String(vid);
}

function subscriptionVariantId(attrs: Record<string, unknown> | undefined): string | null {
  const vid = attrs?.variant_id;
  if (vid === undefined || vid === null) return null;
  return String(vid);
}

function asString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return v;
  return String(v);
}

/**
 * Process verified webhook body. Throws on data errors; route maps to 500.
 * Idempotency is enforced by the route using webhookIdempotencyKey before calling this.
 */
export function processLemonSqueezyWebhookPayload(raw: string): { ok: true; eventName: string } {
  const payload = JSON.parse(raw) as LsWebhookPayload;
  const eventName = payload.meta?.event_name || '';
  const userId = readUserId(payload.meta);

  if (eventName === 'order_created') {
    const attrs = payload.data?.attributes;
    const lsOrderId = payload.data?.id;
    if (!lsOrderId) throw new Error('order_created missing data.id');
    const status = asString(attrs?.status);
    if (status !== 'paid') {
      return { ok: true, eventName };
    }
    if (!userId) {
      throw new Error('order_created missing meta.custom_data.user_id');
    }
    const variantId = firstOrderItemVariantId(attrs);
    if (!variantId) throw new Error('order_created missing variant id');
    const mapping = resolveMappingForLemonVariantId(variantId);
    if (!mapping) {
      throw new Error(`No variant mapping for Lemon Squeezy variant_id=${variantId}`);
    }
    if (mapping.kind === 'subscription') {
      /** Initial subscription payment also emits subscription_* events — avoid duplicate fulfillment. */
      return { ok: true, eventName };
    }
    const total = attrs?.total;
    const totalCents =
      typeof total === 'number' ? total : parseInt(String(total || '0'), 10) || 0;
    const currency = asString(attrs?.currency) || 'USD';
    fulfillOneTimeOrderFromLemonSqueezy({
      userId,
      lemonOrderId: String(lsOrderId),
      productSlug: mapping.productSlug,
      totalCents,
      currency,
    });
    return { ok: true, eventName };
  }

  if (
    eventName === 'subscription_created' ||
    eventName === 'subscription_updated' ||
    eventName === 'subscription_resumed' ||
    eventName === 'subscription_unpaused' ||
    eventName === 'subscription_payment_success' ||
    eventName === 'subscription_payment_recovered'
  ) {
    const attrs = payload.data?.attributes;
    const lsSubId = payload.data?.id;
    if (!lsSubId) throw new Error(`${eventName} missing data.id`);
    const resolvedUser = userIdFromMetaOrExistingSubscription(payload.meta, String(lsSubId));
    if (!resolvedUser) {
      throw new Error(`${eventName} missing user (custom_data.user_id or existing subscription)`);
    }
    const variantId = subscriptionVariantId(attrs);
    if (!variantId) throw new Error(`${eventName} missing variant_id`);
    const mapping = resolveMappingForLemonVariantId(variantId);
    if (!mapping || mapping.kind !== 'subscription') {
      throw new Error(`Variant ${variantId} is not mapped as a subscription plan`);
    }
    const periodStart = asString(attrs?.created_at) || new Date().toISOString();
    let periodEnd =
      asString(attrs?.renews_at) ||
      asString(attrs?.ends_at) ||
      asString(attrs?.trial_ends_at);
    if (!periodEnd) {
      periodEnd = new Date(Date.now() + 30 * 86_400_000).toISOString();
    }
    const cancelled = Boolean(attrs?.cancelled);
    const lsStatus = asString(attrs?.status) || undefined;
    const mapped = mapLsSubscriptionStatus(lsStatus);
    const cancelAtPeriodEnd = cancelled && (mapped === 'active' || mapped === 'trialing');

    upsertSubscriptionFromLemonSqueezy({
      userId: resolvedUser,
      lemonSubscriptionId: String(lsSubId),
      planSlug: mapping.planSlug,
      lsStatus,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
    });
    return { ok: true, eventName };
  }

  if (
    eventName === 'subscription_cancelled' ||
    eventName === 'subscription_expired' ||
    eventName === 'subscription_paused' ||
    eventName === 'subscription_payment_failed'
  ) {
    const attrs = payload.data?.attributes;
    const lsSubId = payload.data?.id;
    if (!lsSubId) throw new Error(`${eventName} missing data.id`);
    const resolvedUser = userIdFromMetaOrExistingSubscription(payload.meta, String(lsSubId));
    if (!resolvedUser) {
      throw new Error(`${eventName} missing user (custom_data.user_id or existing subscription)`);
    }
    const variantId = subscriptionVariantId(attrs);
    if (!variantId) throw new Error(`${eventName} missing variant_id`);
    const mapping = resolveMappingForLemonVariantId(variantId);
    if (!mapping || mapping.kind !== 'subscription') {
      throw new Error(`Variant ${variantId} is not mapped as a subscription plan`);
    }
    const periodStart = asString(attrs?.created_at) || new Date().toISOString();
    const periodEnd =
      asString(attrs?.renews_at) ||
      asString(attrs?.ends_at) ||
      new Date().toISOString();
    upsertSubscriptionFromLemonSqueezy({
      userId: resolvedUser,
      lemonSubscriptionId: String(lsSubId),
      planSlug: mapping.planSlug,
      lsStatus: asString(attrs?.status) || undefined,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
    });
    return { ok: true, eventName };
  }

  if (eventName === 'order_refunded') {
    const lsOrderId = payload.data?.id;
    if (!lsOrderId) throw new Error('order_refunded missing data.id');
    markOrderRefundedByLemonId(String(lsOrderId));
    return { ok: true, eventName };
  }

  /** Ack unhandled events so Lemon Squeezy does not retry indefinitely. */
  return { ok: true, eventName: eventName || 'unknown' };
}
