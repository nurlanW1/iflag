import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import { getSiteOrigin } from '@/lib/seo/site-config';
import { breadcrumbJsonLd } from '@/lib/seo/structured-data';
import VSDesignerClient from './VSDesignerClient';

const title = 'VS Designer - Create Match Graphics & Flag Matchups';
const description =
  'Create professional 1920x1080 VS matchup graphics with country flags, football club logos, scores, events, and clean HD PNG export.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/vs-designer' },
  keywords: [
    'vs designer',
    'match graphic maker',
    'football match poster',
    'flag matchup graphic',
    'sports graphic design',
    'country flag match design',
    'score graphic maker',
    'world cup graphic maker',
  ],
  openGraph: {
    title,
    description,
    url: `${getSiteOrigin()}/vs-designer`,
    type: 'website',
    images: [
      {
        url: '/og-image-v2.png',
        width: 1200,
        height: 630,
        alt: 'Flagswing VS Designer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image-v2.png'],
  },
};

export default function VSDesignerPage() {
  const origin = getSiteOrigin();
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Flagswing VS Designer',
    url: `${origin}/vs-designer`,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description,
    offers: {
      '@type': 'Offer',
      price: PRICING_MARKETING.oneTimeShort.replace(/[^0-9.]/g, '') || '1',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'VS Designer', path: '/vs-designer' },
          ]),
          softwareJsonLd,
        ]}
      />
      <VSDesignerClient />
    </>
  );
}
