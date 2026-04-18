import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/seo/site-config';
import { listCategories, listPublishedProducts } from '@/services/marketplace';

const STATIC_PATHS = [
  '/',
  '/about',
  '/flags',
  '/browse',
  '/assets',
  '/gallery',
  '/subscriptions',
  '/pricing',
  '/contact',
  '/faq',
  '/help',
  '/licenses',
  '/privacy-policy',
  '/terms-of-service',
  '/refunds',
  '/cookies',
  '/blog',
  '/press',
  '/careers',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteOrigin();
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));

  for (const category of listCategories()) {
    if (!category.isApproved) continue;
    entries.push({
      url: `${base}/categories/${category.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    });
  }

  const countryCodes = new Set<string>();
  for (const product of listPublishedProducts()) {
    const cc = product.countryCode?.trim().toUpperCase();
    if (cc && /^[A-Z]{2}$/.test(cc)) {
      countryCodes.add(cc);
    }
  }
  for (const code of countryCodes) {
    entries.push({
      url: `${base}/country/${code.toLowerCase()}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  }

  /** Canonical public product URLs for the marketplace catalog. */
  for (const product of listPublishedProducts()) {
    entries.push({
      url: `${base}/flags/${product.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  return entries;
}
