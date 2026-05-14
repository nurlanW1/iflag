/**
 * Map Lemon Squeezy variant ids ↔ local catalog (subscription plan or product/asset).
 *
 * Two sources, in priority order:
 *   1. `LEMONSQUEEZY_VARIANT_MAP_JSON` env (mirrors the frontend mapping for parity):
 *        {
 *          "subscriptionByPlanSlug": { "pro-monthly": "123456" },
 *          "oneTimeByProductSlug":   { "united-states-standard": "789012" }
 *        }
 *   2. Database lookups against `subscription_plans.provider_variant_id`.
 *
 * Env wins because LS variant ids are environment-specific (test vs live).
 */

import pool from '../db.js';

export type CheckoutKind = 'one_time' | 'subscription';

export type VariantResolution =
  | { kind: 'one_time'; productSlug: string; variantId: string }
  | { kind: 'subscription'; planSlug: string; variantId: string };

interface RawVariantMap {
  oneTimeByProductSlug: Record<string, string>;
  subscriptionByPlanSlug: Record<string, string>;
}

function loadEnvVariantMap(): RawVariantMap {
  const empty: RawVariantMap = {
    oneTimeByProductSlug: {},
    subscriptionByPlanSlug: {},
  };
  const raw = process.env.LEMONSQUEEZY_VARIANT_MAP_JSON?.trim();
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<RawVariantMap>;
    return {
      oneTimeByProductSlug:
        typeof parsed.oneTimeByProductSlug === 'object' && parsed.oneTimeByProductSlug
          ? parsed.oneTimeByProductSlug
          : {},
      subscriptionByPlanSlug:
        typeof parsed.subscriptionByPlanSlug === 'object' && parsed.subscriptionByPlanSlug
          ? parsed.subscriptionByPlanSlug
          : {},
    };
  } catch {
    console.warn('[billing] LEMONSQUEEZY_VARIANT_MAP_JSON is not valid JSON; ignoring.');
    return empty;
  }
}

/**
 * Resolve a checkout for either kind. For subscriptions, falls back to a DB lookup
 * by plan slug if no env mapping is configured.
 */
export async function resolveCheckoutVariant(params: {
  kind: CheckoutKind;
  productSlug?: string | null;
  planSlug?: string | null;
}): Promise<VariantResolution | null> {
  const map = loadEnvVariantMap();

  if (params.kind === 'one_time') {
    if (!params.productSlug) return null;
    const variantId = map.oneTimeByProductSlug[params.productSlug];
    if (!variantId) return null;
    return { kind: 'one_time', productSlug: params.productSlug, variantId };
  }

  if (!params.planSlug) return null;

  const fromEnv = map.subscriptionByPlanSlug[params.planSlug];
  if (fromEnv) {
    return { kind: 'subscription', planSlug: params.planSlug, variantId: fromEnv };
  }

  const fromDb = await pool.query(
    `SELECT provider_variant_id
       FROM subscription_plans
      WHERE slug = $1 AND billing_provider = 'lemonsqueezy' AND is_active = TRUE
      LIMIT 1`,
    [params.planSlug]
  );
  const variantId = fromDb.rows[0]?.provider_variant_id;
  if (!variantId) return null;
  return { kind: 'subscription', planSlug: params.planSlug, variantId };
}

/** Reverse lookup: incoming webhook variant_id → local mapping. */
export async function resolveVariantToLocal(
  variantId: string | number | null | undefined
): Promise<VariantResolution | null> {
  if (variantId === null || variantId === undefined) return null;
  const key = String(variantId);
  const map = loadEnvVariantMap();

  for (const [productSlug, vid] of Object.entries(map.oneTimeByProductSlug)) {
    if (vid === key) return { kind: 'one_time', productSlug, variantId: key };
  }
  for (const [planSlug, vid] of Object.entries(map.subscriptionByPlanSlug)) {
    if (vid === key) return { kind: 'subscription', planSlug, variantId: key };
  }

  const fromDb = await pool.query(
    `SELECT slug FROM subscription_plans
      WHERE billing_provider = 'lemonsqueezy' AND provider_variant_id = $1
      LIMIT 1`,
    [key]
  );
  const planSlug = fromDb.rows[0]?.slug;
  if (planSlug) {
    return { kind: 'subscription', planSlug, variantId: key };
  }

  return null;
}

/** Map LS subscription status → internal status enum (see user_subscriptions.status). */
export function mapLemonStatus(
  lsStatus: string | null | undefined
): 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing' | 'paused' | 'unpaid' {
  switch ((lsStatus || '').toLowerCase()) {
    case 'active':
      return 'active';
    case 'on_trial':
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'paused':
      return 'paused';
    case 'unpaid':
      return 'unpaid';
    case 'cancelled':
    case 'canceled':
      return 'canceled';
    case 'expired':
      return 'expired';
    default:
      return 'active';
  }
}
