/**
 * Single source of truth for public pricing (display + checkout slugs).
 *
 * Paddle one-time price (`pri_*`) must match via backend `PADDLE_PRICE_MAP_JSON`
 * `oneTimeByProductSlug` (default `flag-stock` or per-asset slug).
 */

export const PRICING_CURRENCY = 'USD' as const;

/** Flat one-time purchase for every paid flag design (all formats in one checkout). */
export const ONE_TIME_STOCK = {
  displayCents: 100,
  currency: PRICING_CURRENCY,
  /** Default key in `PADDLE_PRICE_MAP_JSON.oneTimeByProductSlug`. */
  productSlug: 'flag-stock',
} as const;

/** Shown near checkout CTAs. */
export const PRICING_CHECKOUT_DISCLAIMER =
  'Payments are processed by Paddle (Merchant of Record). Final price and tax are confirmed at checkout before you pay.';

/** Format cents as localized currency (always shows cents for sub-dollar amounts). */
export function formatPricingMoney(cents: number, currency: string = PRICING_CURRENCY): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/** Shared marketing copy — import here instead of hardcoding dollar amounts in UI. */
export const PRICING_MARKETING = {
  oneTimeShort: formatPricingMoney(ONE_TIME_STOCK.displayCents),
  oneTimePerAsset: `${formatPricingMoney(ONE_TIME_STOCK.displayCents)} per design`,
  plansLine: `${formatPricingMoney(ONE_TIME_STOCK.displayCents)} per flag design · official flat flags free`,
  homepageBlurb: `Official country flat flags stay free. Every other published design is ${formatPricingMoney(ONE_TIME_STOCK.displayCents)} — one-time Paddle checkout, all formats included.`,
  catalogRailSubtitle: `${formatPricingMoney(ONE_TIME_STOCK.displayCents)} per design · official flats free`,
  pricingPageDescription: `Official flat flags are free. All other flag designs are ${formatPricingMoney(ONE_TIME_STOCK.displayCents)} each via Paddle.`,
} as const;

/** Default list/card price when a paid asset has no explicit DB price. */
export function resolveCatalogDisplayPriceCents(
  priceCents: number,
  hasPaidTier: boolean,
): number {
  if (priceCents > 0) return priceCents;
  return hasPaidTier ? ONE_TIME_STOCK.displayCents : 0;
}

export function productHasPaidTier(product: {
  priceCents: number;
  files: readonly { tier: string }[];
}): boolean {
  return product.priceCents > 0 || product.files.some((f) => f.tier === 'pro');
}
