import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';
import { getSiteOrigin } from '@/lib/seo/site-config';
import { breadcrumbJsonLd } from '@/lib/seo/structured-data';
import VSDesignerClient from './VSDesignerClient';

const title = 'Football Banner Creator - Match Day, Score & VS Graphics';
const description =
  'Create 1920x1080 football banners online: match day posters, score graphics, group lineup banners, club logos, country flags, stadium backgrounds, and PNG export.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/vs-designer' },
  keywords: [
    'vs designer',
    'football banner creator',
    'football banner maker',
    'football poster maker',
    'football graphic maker',
    'match day banner',
    'matchday poster maker',
    'football match day poster',
    'football score graphic',
    'score graphic maker',
    'football result banner',
    'group lineup banner',
    'football club banner',
    'football thumbnail maker',
    'soccer banner maker',
    'sports banner maker',
    'fixture poster maker',
    'football blog graphics',
    'match graphic maker',
    'football match poster',
    'flag matchup graphic',
    'sports graphic design',
    'country flag match design',
    'world cup graphic maker',
    'stadium background banner',
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
    applicationSubCategory: 'Football banner creator',
    operatingSystem: 'Web',
    description,
    featureList: [
      'Match day football banner creator',
      'Full-time score graphic maker',
      'Group lineup banner template',
      'Country flag and football club logo selection',
      'Stadium background and image upload',
      '1920x1080 PNG export',
      'Free watermarked preview and paid clean HD export',
    ],
    keywords: 'football banner creator, match day banner, score graphic maker, football poster maker, soccer banner maker, VS Designer',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: PRICING_MARKETING.oneTimeShort.replace(/[^0-9.]/g, '') || '1',
      priceCurrency: 'USD',
    },
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I create football match day banners online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Flagswing VS Designer creates football match day banners with team names, club logos or country flags, event titles, stadium backgrounds, and 1920x1080 PNG export.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I make football score graphics and result banners?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The result template lets you create football score graphics, full-time result banners, and social media match graphics for blogs and channels.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does the football banner maker support stadium backgrounds?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can use the built-in stadium theme or import your own background image for match posters and football thumbnails.',
        },
      },
    ],
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
          faqJsonLd,
        ]}
      />
      <VSDesignerClient />
    </>
  );
}
