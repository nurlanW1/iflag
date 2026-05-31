/**
 * Paddle Billing — map local catalog slugs ↔ Paddle price ids (`pri_*`).
 *
 * Source order (first match wins):
 *   1. `PADDLE_PRICE_MAP_JSON` env (subscriptionByPlanSlug / oneTimeByProductSlug → `pri_*`).
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

/** Flat catalog one-time checkout slug (see frontend `ONE_TIME_STOCK.productSlug`). */
const ONE_TIME_STOCK_SLUG = 'flag-stock';
const SUBSCRIPTION_PLAN_SLUG_ALIASES: Record<string, string[]> = {
  'pro-weekly': ['weekly-premium'],
  'pro-monthly': ['monthly-premium'],
  'pro-annual': ['annual-premium'],
};

function subscriptionPlanSlugCandidates(planSlug: string): string[] {
  const aliases = SUBSCRIPTION_PLAN_SLUG_ALIASES[planSlug] ?? [];
  return [planSlug, ...aliases.filter((slug) => slug !== planSlug)];
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

/** Single $1 Paddle price for every premium asset (ignores per-asset slugs). */
export function resolveOneTimeStockPriceId(): { priceId: string } | null {
  const map = loadEnvMap();
  const priceId = map.oneTimeByProductSlug[ONE_TIME_STOCK_SLUG]?.trim();
  if (!priceId) return null;
  return { priceId };
}

export { ONE_TIME_STOCK_SLUG };

export async function resolvePaddlePriceForCheckout(params: {
  kind: CheckoutKind;
  productSlug?: string | null;
  planSlug?: string | null;
}): Promise<PaddleVariantResolution | null> {
  const map = loadEnvMap();

  if (params.kind === 'one_time') {
    const stock = resolveOneTimeStockPriceId();
    if (!stock) return null;
    return {
      kind: 'one_time',
      productSlug: ONE_TIME_STOCK_SLUG,
      priceId: stock.priceId,
    };
  }

  if (!params.planSlug) return null;

  for (const slug of subscriptionPlanSlugCandidates(params.planSlug)) {
    const fromEnv = map.subscriptionByPlanSlug[slug];
    if (fromEnv) {
      return { kind: 'subscription', planSlug: params.planSlug, priceId: fromEnv };
    }
  }

  for (const slug of subscriptionPlanSlugCandidates(params.planSlug)) {
    const r = await pool.query(
      `SELECT provider_variant_id
         FROM subscription_plans
        WHERE slug = $1 AND billing_provider = 'paddle' AND is_active = TRUE
        LIMIT 1`,
      [slug]
    );
    const priceId = r.rows[0]?.provider_variant_id;
    if (priceId) {
      return { kind: 'subscription', planSlug: params.planSlug, priceId };
    }
  }

  return null;
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
