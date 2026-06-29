import Link from 'next/link';
import type { Metadata } from 'next';
import HomePageClientGate from '@/components/HomePageClientGate';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/structured-data';
import { SITE_NAME, getSiteOrigin } from '@/lib/seo/site-config';
import { PRIMARY_HUB_LINKS } from '@/lib/seo/internal-links';

const homeTitle = 'Free Flag SVG PNG Downloads, VS Designer & Flag Quiz';
const homeDescription =
  'Download world flag SVG, PNG, EPS and WebP files, create 1920x1080 VS match graphics, design custom flags, and learn flags with a fast quiz.';

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: '/' },
  keywords: [
    'flag svg download',
    'free flag png',
    'world flags',
    'country flag vector',
    'vs designer',
    'match graphic maker',
    'flag editor',
    'flag quiz',
    'football match poster',
  ],
  openGraph: {
    title: `${SITE_NAME} - ${homeTitle}`,
    description: homeDescription,
    url: getSiteOrigin(),
    type: 'website',
    images: [
      {
        url: '/og-image-v2.png',
        width: 1200,
        height: 630,
        alt: 'Flagswing flag downloads, VS Designer, Flag Editor, and Flag Quiz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - ${homeTitle}`,
    description: homeDescription,
    images: ['/og-image-v2.png'],
  },
};

export default function HomePage() {
  const origin = getSiteOrigin();
  const toolListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Flagswing flag tools and downloads',
    description: homeDescription,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'World flag gallery', url: `${origin}/gallery` },
      { '@type': 'ListItem', position: 2, name: 'VS Designer match graphic maker', url: `${origin}/vs-designer` },
      { '@type': 'ListItem', position: 3, name: 'Flag Editor custom flag maker', url: `${origin}/editor/blank` },
      { '@type': 'ListItem', position: 4, name: 'Flag Quiz learning game', url: `${origin}/flag-quiz` },
      { '@type': 'ListItem', position: 5, name: 'Pricing and licenses', url: `${origin}/pricing` },
    ],
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I download flags for free on Flagswing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Flagswing provides free official flat country flag downloads where published, with premium variants and creator exports available separately.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I create football match graphics online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. VS Designer creates 1920x1080 country and football matchup graphics with flags, team names, scores, events, and PNG export.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which flag formats are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Published asset pages can include SVG, EPS, PNG, JPG, and WebP files depending on the design and source upload.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Home', path: '/' }]), toolListJsonLd, faqJsonLd]} />
      <nav className="sr-only" aria-label="Site sections">
        <ul>
          {PRIMARY_HUB_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <HomePageClientGate />
    </>
  );
}
