import type { Metadata } from 'next';

/** Public site name for metadata, JSON-LD, and `<title>` — customize branding here only. */
export const SITE_NAME = 'Flagswing';

/** Short default description; override per-page with `description` in metadata. */
export const SITE_DESCRIPTION =
  'Discover and download flag assets in vector and raster formats for creative and professional projects.';

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
      default: `${SITE_NAME} — Flag marketplace`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: {
      canonical: './',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      title: `${SITE_NAME} — Flag marketplace`,
      description: SITE_DESCRIPTION,
      url: origin,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — Flag marketplace`,
      description: SITE_DESCRIPTION,
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
