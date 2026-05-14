/**
 * Paddle Billing — map local catalog slugs ↔ Paddle price ids (`pri_*`).
 *
 * Source order (first match wins):
 *   1. `PADDLE_PRICE_MAP_JSON` env (same shape as Lemon Squeezy's variant map).
 *   2. `subscription_plans.provider_variant_id` for the matching slug.
 */

import pool from '../../db.js';

export type CheckoutKind = 'one_time' | 'subscription';

export type PaddleVariantResolution =
  | { kind: 'one_time'; productSlug: string; priceId: string }
  | { kind: 'subscription'; planSlug: string; priceId: string };

interface PriceMap {
  oneTimeByProductSlug: Record<string, string>;
  subscriptionByPlanSlug: Record<string, string>;
}

function loadEnvMap(): PriceMap {
  const empty: PriceMap = {
    oneTimeByProductSlug: {},
    subscriptionByPlanSlug: {},
  };
  const raw = process.env.PADDLE_PRICE_MAP_JSON?.trim();
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<PriceMap>;
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
    console.warn('[paddle] PADDLE_PRICE_MAP_JSON is not valid JSON; ignoring.');
    return empty;
  }
}

export async function resolvePaddlePriceForCheckout(params: {
  kind: CheckoutKind;
  productSlug?: string | null;
  planSlug?: string | null;
}): Promise<PaddleVariantResolution | null> {
  const map = loadEnvMap();

  if (params.kind === 'one_time') {
    if (!params.productSlug) return null;
    const priceId = map.oneTimeByProductSlug[params.productSlug];
    if (!priceId) return null;
    return { kind: 'one_time', productSlug: params.productSlug, priceId };
  }

  if (!params.planSlug) return null;
  const fromEnv = map.subscriptionByPlanSlug[params.planSlug];
  if (fromEnv) {
    return { kind: 'subscription', planSlug: params.planSlug, priceId: fromEnv };
  }

  const r = await pool.query(
    `SELECT provider_variant_id
       FROM subscription_plans
      WHERE slug = $1 AND billing_provider = 'paddle' AND is_active = TRUE
      LIMIT 1`,
    [params.planSlug]
  );
  const priceId = r.rows[0]?.provider_variant_id;
  if (!priceId) return null;
  return { kind: 'subscription', planSlug: params.planSlug, priceId };
}

export async function resolvePaddlePriceToLocal(
  priceId: string | null | undefined
): Promise<PaddleVariantResolution | null> {
  if (!priceId) return null;
  const map = loadEnvMap();

  for (const [productSlug, pid] of Object.entries(map.oneTimeByProductSlug)) {
    if (pid === priceId) return { kind: 'one_time', productSlug, priceId };
  }
  for (const [planSlug, pid] of Object.entries(map.subscriptionByPlanSlug)) {
    if (pid === priceId) return { kind: 'subscription', planSlug, priceId };
  }

  const r = await pool.query(
    `SELECT slug FROM subscription_plans
      WHERE billing_provider = 'paddle' AND provider_variant_id = $1
      LIMIT 1`,
    [priceId]
  );
  const planSlug = r.rows[0]?.slug;
  if (planSlug) {
    return { kind: 'subscription', planSlug, priceId };
  }
  return null;
}

/**
 * Map Paddle Billing subscription status → internal status enum.
 * Paddle docs: active, canceled, past_due, paused, trialing.
 */
export function mapPaddleSubscriptionStatus(
  status: string | null | undefined
):
  | 'active'
  | 'canceled'
  | 'expired'
  | 'past_due'
  | 'trialing'
  | 'paused'
  | 'unpaid' {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'paused':
      return 'paused';
    case 'canceled':
      return 'canceled';
    default:
      return 'active';
  }
}
