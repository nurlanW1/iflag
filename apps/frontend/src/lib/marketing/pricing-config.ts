/**
 * Single source of truth for public pricing (display + checkout slugs).
 *
 * Paddle catalog prices (`pri_*`) must match via backend `PADDLE_PRICE_MAP_JSON`
 * or `subscription_plans.provider_variant_id`.
 */

export type BillingInterval = 'weekly' | 'monthly';

export type PlanTierId = 'free' | 'pro' | 'business';

export const PRICING_CURRENCY = 'USD' as const;

/** Flat one-time purchase for a single stock / flag asset. */
export const ONE_TIME_STOCK = {
  displayCents: 99,
  currency: PRICING_CURRENCY,
  /** Key in `PADDLE_PRICE_MAP_JSON.oneTimeByProductSlug`. */
  productSlug: 'flag-stock',
} as const;

export const PRO_CHECKOUT = {
  weekly: {
    displayCents: 499,
    currency: PRICING_CURRENCY,
    planSlug: 'pro-weekly',
  },
  monthly: {
    displayCents: 999,
    currency: PRICING_CURRENCY,
    planSlug: 'pro-monthly',
  },
} as const;

/** Shown under prices on the pricing page. */
export const PRICING_CHECKOUT_DISCLAIMER =
  'Payments are processed by Paddle (Merchant of Record). Final price, tax, and renewal terms are confirmed at Paddle checkout before you pay. License terms for each asset still apply at download.';

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

/** Savings choosing monthly over ~4 weekly renewals. */
export function monthlyVsWeeklySavingsPercent(): number {
  const fourWeeks = PRO_CHECKOUT.weekly.displayCents * 4;
  if (fourWeeks <= PRO_CHECKOUT.monthly.displayCents) return 0;
  return Math.round((1 - PRO_CHECKOUT.monthly.displayCents / fourWeeks) * 100);
}

/** Savings vs buying `downloadCount` assets at the one-time price. */
export function monthlyVsOneTimeSavingsPercent(downloadCount: number): number {
  const oneTimeTotal = downloadCount * ONE_TIME_STOCK.displayCents;
  if (oneTimeTotal <= PRO_CHECKOUT.monthly.displayCents) return 0;
  return Math.round((1 - PRO_CHECKOUT.monthly.displayCents / oneTimeTotal) * 100);
}

/** Downloads per month where monthly subscription beats one-time purchases. */
export const SUBSCRIPTION_BREAK_EVEN_DOWNLOADS = Math.ceil(
  PRO_CHECKOUT.monthly.displayCents / ONE_TIME_STOCK.displayCents,
);

export interface ComparisonRow {
  id: string;
  label: string;
  free: string;
  pro: string;
  business: string;
}

export const PRICING_COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'previews',
    label: 'Free preview downloads',
    free: 'Yes, where available',
    pro: 'Yes',
    business: 'Yes',
  },
  {
    id: 'pro_via_sub',
    label: 'Full-resolution (Pro) downloads',
    free: '—',
    pro: 'Included while subscription is active',
    business: 'Included while subscription is active',
  },
  {
    id: 'ownership',
    label: 'Own a flag forever (one-time purchase)',
    free: `${formatPricingMoney(ONE_TIME_STOCK.displayCents)} per asset`,
    pro: `${formatPricingMoney(ONE_TIME_STOCK.displayCents)} per asset`,
    business: `${formatPricingMoney(ONE_TIME_STOCK.displayCents)} per asset`,
  },
  {
    id: 'sub_vs_own',
    label: 'Subscription vs ownership',
    free: 'N/A',
    pro: `Subscribe from ${formatPricingMoney(PRO_CHECKOUT.monthly.displayCents)}/mo for catalog access, or buy individual assets at ${formatPricingMoney(ONE_TIME_STOCK.displayCents)} each.`,
    business: 'Same as Pro',
  },
  {
    id: 'billing',
    label: 'Billing',
    free: '—',
    pro: `Weekly (${formatPricingMoney(PRO_CHECKOUT.weekly.displayCents)}) or monthly (${formatPricingMoney(PRO_CHECKOUT.monthly.displayCents)}) via Paddle`,
    business: 'Planned',
  },
];

export interface PlanCardCopy {
  id: PlanTierId;
  name: string;
  tagline: string;
  bullets: string[];
  highlighted?: boolean;
  comingSoon?: boolean;
}

export const PLAN_CARD_COPY: PlanCardCopy[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Browse the catalog and use free previews.',
    bullets: [
      'Access free preview files where we publish them',
      `Buy individual flags for ${formatPricingMoney(ONE_TIME_STOCK.displayCents)} via Paddle checkout`,
      'No subscription required',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Download Pro files across the catalog while you are subscribed.',
    bullets: [
      'Pro-tier downloads for published products while your plan is active',
      `Or own a single asset for ${formatPricingMoney(ONE_TIME_STOCK.displayCents)} without subscribing`,
      'Cancel or update payment methods in your Paddle customer portal',
    ],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Teams and higher volume — on our roadmap.',
    bullets: [
      'Invoicing, seats, or custom terms — tell us what you need',
      'We will publish Business pricing when it is ready',
    ],
    comingSoon: true,
  },
];

/** Homepage / marketing plan cards (weekly + monthly). */
export const HOMEPAGE_PLAN_CARDS = [
  {
    name: 'Weekly',
    priceCents: PRO_CHECKOUT.weekly.displayCents,
    period: 'per week',
    planSlug: PRO_CHECKOUT.weekly.planSlug,
    features: [
      'Unlimited Pro downloads while active',
      'All published formats',
      'Cancel anytime in Paddle portal',
    ],
    popular: false,
  },
  {
    name: 'Monthly',
    priceCents: PRO_CHECKOUT.monthly.displayCents,
    period: 'per month',
    planSlug: PRO_CHECKOUT.monthly.planSlug,
    savingsBadge: `Save ${monthlyVsWeeklySavingsPercent()}% vs weekly`,
    features: [
      'Everything in Weekly',
      `Best value after ${SUBSCRIPTION_BREAK_EVEN_DOWNLOADS}+ downloads`,
      'Priority catalog access',
    ],
    popular: true,
  },
] as const;
