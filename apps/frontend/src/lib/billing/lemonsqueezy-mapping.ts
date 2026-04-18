/**
 * Maps Lemon Squeezy variant ids → local catalog (one-time flag vs subscription plan).
 *
 * Configure via LEMONSQUEEZY_VARIANT_MAP_JSON (single JSON object):
 * {
 *   "oneTimeByProductSlug": {
 *     "united-states-standard": "123456"   // LS variant id as string
 *   },
 *   "subscriptionByPlanSlug": {
 *     "pro-monthly": "789012"
 *   }
 * }
 *
 * - oneTimeByProductSlug keys MUST match Product.slug in the marketplace seed / DB.
 * - subscriptionByPlanSlug keys MUST match SubscriptionPlan.slug (e.g. pro-monthly).
 *
 * All variant ids are strings to match API JSON:API ids.
 */

export type CheckoutKind = 'one_time' | 'subscription';

export type VariantResolution =
  | { kind: 'one_time'; productSlug: string; variantId: string }
  | { kind: 'subscription'; planSlug: string; variantId: string };

export type LemonSqueezyVariantMapFile = {
  oneTimeByProductSlug: Record<string, string>;
  subscriptionByPlanSlug: Record<string, string>;
};

function parseVariantMapJson(raw: string | undefined): LemonSqueezyVariantMapFile | null {
  if (!raw?.trim()) return null;
  try {
    const v = JSON.parse(raw) as LemonSqueezyVariantMapFile;
    if (!v || typeof v !== 'object') return null;
    return {
      oneTimeByProductSlug:
        typeof v.oneTimeByProductSlug === 'object' && v.oneTimeByProductSlug
          ? v.oneTimeByProductSlug
          : {},
      subscriptionByPlanSlug:
        typeof v.subscriptionByPlanSlug === 'object' && v.subscriptionByPlanSlug
          ? v.subscriptionByPlanSlug
          : {},
    };
  } catch {
    return null;
  }
}

export function getLemonSqueezyVariantMap(): LemonSqueezyVariantMapFile {
  const fromEnv = parseVariantMapJson(process.env.LEMONSQUEEZY_VARIANT_MAP_JSON);
  return (
    fromEnv ?? {
      oneTimeByProductSlug: {},
      subscriptionByPlanSlug: {},
    }
  );
}

/** Resolve LS variant id from a webhook first_order_item / subscription attribute (string or number). */
export function resolveMappingForLemonVariantId(
  variantId: string | number | undefined | null
): VariantResolution | null {
  if (variantId === undefined || variantId === null) return null;
  const key = String(variantId);
  const map = getLemonSqueezyVariantMap();
  for (const [productSlug, vid] of Object.entries(map.oneTimeByProductSlug)) {
    if (vid === key) return { kind: 'one_time', productSlug, variantId: key };
  }
  for (const [planSlug, vid] of Object.entries(map.subscriptionByPlanSlug)) {
    if (vid === key) return { kind: 'subscription', planSlug, variantId: key };
  }
  return null;
}

export function resolveCheckoutVariant(
  kind: CheckoutKind,
  productSlug: string | null,
  planSlug: string | null
): VariantResolution | null {
  const map = getLemonSqueezyVariantMap();
  if (kind === 'one_time') {
    if (!productSlug) return null;
    const variantId = map.oneTimeByProductSlug[productSlug];
    if (!variantId) return null;
    return { kind: 'one_time', productSlug, variantId };
  }
  if (!planSlug) return null;
  const variantId = map.subscriptionByPlanSlug[planSlug];
  if (!variantId) return null;
  return { kind: 'subscription', planSlug, variantId };
}
