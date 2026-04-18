import type { Metadata } from 'next';
import type { Product } from '@/types/marketplace';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';

/** Canonical public URL path for catalog products (SEO / AdSense friendly). */
export const marketplaceProductCanonicalPath = (slug: string) => `/flags/${slug}`;

export function buildMarketplaceProductMetadata(product: Product): Metadata {
  const titleSegment = product.seo.metaTitle || product.title;
  const description =
    product.seo.metaDescription ||
    product.description ||
    `View and download ${product.title} on ${SITE_NAME}.`;
  const canonical = marketplaceProductCanonicalPath(product.slug);
  const ogImage = product.seo.ogImageUrl || product.previewUrl || product.thumbnailUrl;
  const ogTitle = `${titleSegment} | ${SITE_NAME}`;
  return {
    title: titleSegment,
    description,
    alternates: { canonical },
    openGraph: {
      siteName: SITE_NAME,
      title: ogTitle,
      description,
      url: `${getSiteOrigin()}${canonical}`,
      images: ogImage ? [{ url: ogImage, alt: `${product.title} flag` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
