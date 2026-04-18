import type { Metadata } from 'next';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';

export function legalPageMetadata(
  path: string,
  title: string,
  description: string
): Metadata {
  const canonical = path.startsWith('/') ? path : `/${path}`;
  const url = `${getSiteOrigin()}${canonical}`;
  /** Use title segment so root `title.template` (`%s | ${SITE_NAME}`) stays consistent. */
  const ogTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      siteName: SITE_NAME,
      title: ogTitle,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: ogTitle,
      description,
    },
  };
}
