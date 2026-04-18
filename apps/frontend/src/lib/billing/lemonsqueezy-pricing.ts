/**
 * Legacy export surface — canonical numbers live in `@/lib/marketing/pricing-config`.
 */

import { PRO_CHECKOUT } from '@/lib/marketing/pricing-config';

export const PLACEHOLDER_PLAN_COPY = {
  proMonthly: {
    headline: 'Pro Monthly',
    displayFromCents: PRO_CHECKOUT.monthly.displayCents,
    currency: PRO_CHECKOUT.monthly.currency,
    note: 'Display only; Lemon Squeezy sets the charged amount at checkout.',
  },
} as const;

export const PLACEHOLDER_ONE_TIME_COPY = {
  notConfigured:
    'Checkout is not configured. Set LEMONSQUEEZY_* environment variables and variant map.',
} as const;
