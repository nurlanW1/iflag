import Link from 'next/link';
import type { Metadata } from 'next';
import HomePageClientGate from '@/components/HomePageClientGate';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/structured-data';
import { SITE_NAME, getSiteOrigin } from '@/lib/seo/site-config';
import { PRIMARY_HUB_LINKS } from '@/lib/seo/internal-links';

const homeTitle = 'Free Flag Downloads, Football Banner Creator & Flag Quiz';
const homeDescription =
  'Download world flag SVG, PNG, EPS and WebP files, create 1920x1080 football match day banners, score graphics, VS posters, and learn flags with a fast quiz.';

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
    'football banner creator',
    'football banner maker',
    'football poster maker',
    'match day banner',
    'football score graphic',
    'football result banner',
    'group lineup banner',
    'soccer banner maker',
    'football thumbnail maker',
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
      { '@type': 'ListItem', position: 2, name: 'Football banner creator and VS Designer', url: `${origin}/vs-designer` },
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
          text: 'Yes. VS Designer creates 1920x1080 football match day banners, score graphics, result posters, group lineup banners, and VS matchup graphics with flags, team names, club logos, stadium backgrounds, and PNG export.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can football bloggers and commentators make banners on Flagswing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Football bloggers, commentators, and social media creators can make match day posts, full-time score graphics, football thumbnails, and club or country VS banners online.',
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
