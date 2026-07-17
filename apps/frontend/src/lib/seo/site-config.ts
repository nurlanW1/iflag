import type { Metadata } from 'next';

/** Public site name for metadata, JSON-LD, and `<title>` — customize branding here only. */
export const SITE_NAME = 'Flagswing';

/** Short default description; override per-page with `description` in metadata. */
export const SITE_DESCRIPTION =
  'Download country flags in SVG, PNG, EPS formats, design custom flags, create football match day banners and VS matchup graphics, and play a world flag quiz.';

/**
 * Canonical site origin for metadataBase, sitemap, and robots.
 * Set `NEXT_PUBLIC_SITE_URL` in production (e.g. https://flagswing.example).
 * On Vercel, `VERCEL_URL` is used as a fallback (https).
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, '');
    return `https://${host}`;
  }
  return 'http://localhost:3000';
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteOrigin()}/`);
}

export function buildDefaultMetadata(): Metadata {
  const origin = getSiteOrigin();
  const metadataBase = getMetadataBase();
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase,
    title: {
      default: `${SITE_NAME} — Flag Assets SVG PNG Free Download`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: {
      canonical: './',
    },
    keywords: [
      'flag svg download',
      'country flag vector',
      'flag png free',
      'flag icons',
      'historical flags',
      'uzbekistan flag svg',
      'usa flag vector',
      'flag assets',
      'flag stock',
      'national flag download',
      'flag eps',
      'world flags',
      'flag mockup',
      'flag illustration',
      'flag editor',
      'flag maker',
      'vs designer',
      'football banner creator',
      'football banner maker',
      'football poster maker',
      'football graphic maker',
      'match day banner',
      'matchday poster maker',
      'football score graphic',
      'football result banner',
      'football club banner',
      'group lineup banner',
      'soccer banner maker',
      'football thumbnail maker',
      'sports banner maker',
      'match graphic maker',
      'flag quiz',
      'football match poster',
    ],
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      title: `${SITE_NAME} — Flag Assets SVG PNG Free Download`,
      description: 'Country flag downloads, custom flag editor, football banner creator, VS matchup graphic maker, and a world flag quiz for creators.',
      url: origin,
      images: [
        {
          url: '/og-image-v2.png',
          width: 1200,
          height: 630,
          alt: 'Flagswing — World Flag Asset Library',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — Flag Assets SVG PNG Free Download`,
      description: 'Flag downloads, football banner creator, editor tools, VS graphics, and a world flag quiz.',
      images: ['/og-image-v2.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
  };
}
