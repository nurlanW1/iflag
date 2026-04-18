import type { Metadata } from 'next';
import { PricingPlansClient } from '@/components/pricing/PricingPlansClient';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `Pricing — ${SITE_NAME}`,
  description:
    'Choose Free previews, Pro subscription for catalog-wide downloads, or buy individual flags to own. Prices confirmed at Lemon Squeezy checkout.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: `Pricing — ${SITE_NAME}`,
    description:
      'Free previews, Pro subscription, and one-time purchases. Compare plans and subscribe via Lemon Squeezy.',
    url: `${getSiteOrigin()}/pricing`,
  },
};

export default function PricingPage() {
  return <PricingPlansClient />;
}
