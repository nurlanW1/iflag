/**
 * Pricing & plan copy for the public pricing page.
 *
 * Edit amounts and bullets here to keep marketing in sync with your Lemon Squeezy store.
 * Checkout always charges what is configured in Lemon Squeezy — update display prices when you
 * change variants there so customers are not surprised at checkout.
 */

export type BillingInterval = 'monthly' | 'annual';

export type PlanTierId = 'free' | 'pro' | 'business';

/** Shown under prices on the pricing page. */
export const PRICING_CHECKOUT_DISCLAIMER =
  'Final price, tax, and renewal terms are confirmed on Lemon Squeezy before you pay. License terms for each asset still apply at download.';

export const PRO_CHECKOUT = {
  monthly: {
    /** Display only — set to match your monthly variant in Lemon Squeezy. */
    displayCents: 2999,
    currency: 'USD' as const,
    /** Must match `subscriptionByPlanSlug` in `LEMONSQUEEZY_VARIANT_MAP_JSON`. */
    lemonSqueezyPlanSlug: 'pro-monthly',
  },
  annual: {
    /**
     * Set `enabled: true` when an annual variant exists and is mapped in env.
     * Until then the UI shows “coming soon” for annual but keeps the data shape.
     */
    enabled: false,
    /** Example annual display; unused until `enabled` is true. */
    displayCents: 29_900,
    currency: 'USD' as const,
    lemonSqueezyPlanSlug: 'pro-annual',
 },
} as const;

export interface ComparisonRow {
  id: string;
  label: string;
  free: string;
  pro: string;
  business: string;
}

/** Feature comparison — keep wording factual; avoid guarantees you cannot enforce in product. */
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
    free: 'Available separately',
    pro: 'Available separately',
    business: 'Available separately',
  },
  {
    id: 'sub_vs_own',
    label: 'Subscription vs ownership',
    free: 'N/A',
    pro: 'Subscription unlocks Pro files during the paid period. Buying a product outright keeps Pro files in your account without an active subscription.',
    business: 'Same as Pro',
  },
  {
    id: 'billing',
    label: 'Billing',
    free: '—',
    pro: 'Monthly or annual (when enabled) via Lemon Squeezy',
    business: 'Planned',
  },
];

export interface PlanCardCopy {
  id: PlanTierId;
  name: string;
  tagline: string;
  bullets: string[];
  /** Visually emphasize this tier on the pricing page. */
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
      'Buy individual flags anytime if you want permanent Pro access to those products',
      'No subscription required',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Download Pro files across the catalog while you are subscribed.',
    bullets: [
      'Pro-tier downloads for published products while your plan is active',
      'Cancel or change billing in Lemon Squeezy',
      'One-time purchases still available if you prefer to own specific assets long-term',
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
