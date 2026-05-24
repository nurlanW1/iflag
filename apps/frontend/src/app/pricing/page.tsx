import type { Metadata } from 'next';
import { PricingPlansClient } from '@/components/pricing/PricingPlansClient';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `Pricing — ${SITE_NAME}`,
  description: `${PRICING_MARKETING.pricingPageDescription} Checkout and receipts are handled by Paddle (Merchant of Record).`,
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: `Pricing — ${SITE_NAME}`,
    description: PRICING_MARKETING.pricingPageDescription,
    url: `${getSiteOrigin()}/pricing`,
  },
};

export default function PricingPage() {
  return <PricingPlansClient />;
}
