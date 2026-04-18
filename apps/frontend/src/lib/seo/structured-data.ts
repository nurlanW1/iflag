import { getSiteOrigin, SITE_DESCRIPTION, SITE_NAME } from './site-config';
import type { AssetSeoPayload } from './asset-metadata';
import type { Category } from '@/types/marketplace';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';

const context = 'https://schema.org';

export function websiteJsonLd(): Record<string, unknown> {
  const origin = getSiteOrigin();
  return {
    '@context': context,
    '@type': 'WebSite',
    name: SITE_NAME,
    url: origin,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/browse?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  const origin = getSiteOrigin();
  return {
    '@context': context,
    '@type': 'Organization',
    name: SITE_NAME,
    url: origin,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  const origin = getSiteOrigin();
  return {
    '@context': context,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };
}

export function productJsonLd(
  slug: string,
  payload: AssetSeoPayload,
  publicProduct?: PublicProduct | null
): Record<string, unknown> {
  const origin = getSiteOrigin();
  const path = payload.canonicalPath ?? `/flags/${slug}`;
  const productUrl = `${origin}${path}`;
  const images = [payload.image, publicProduct?.thumbnailUrl, publicProduct?.previewUrl].filter(
    (u): u is string => typeof u === 'string' && u.length > 0
  );

  const offers =
    publicProduct && publicProduct.priceCents >= 0
      ? {
          '@type': 'Offer',
          priceCurrency: publicProduct.currency || 'USD',
          price: (publicProduct.priceCents / 100).toFixed(2),
          availability: 'https://schema.org/InStock',
          url: productUrl,
        }
      : payload.priceCents != null && payload.currency
        ? {
            '@type': 'Offer',
            priceCurrency: payload.currency,
            price: (payload.priceCents / 100).toFixed(2),
            availability: 'https://schema.org/InStock',
            url: productUrl,
          }
        : undefined;

  return {
    '@context': context,
    '@type': 'Product',
    name: payload.title,
    description: payload.description || undefined,
    image: images.length ? images : undefined,
    sku: slug,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    url: productUrl,
    ...(offers ? { offers } : {}),
  };
}

export function categoryCollectionJsonLd(category: Category, productCount: number): Record<string, unknown> {
  const origin = getSiteOrigin();
  const url = `${origin}/categories/${category.slug}`;
  return {
    '@context': context,
    '@type': 'CollectionPage',
    name: `${category.name} — ${SITE_NAME}`,
    description: category.description || `${category.name} flags and assets on ${SITE_NAME}.`,
    url,
    numberOfItems: productCount,
  };
}

export function countryCollectionJsonLd(countryCode: string, productCount: number): Record<string, unknown> {
  const origin = getSiteOrigin();
  const url = `${origin}/country/${countryCode.toLowerCase()}`;
  return {
    '@context': context,
    '@type': 'CollectionPage',
    name: `Flags — ${countryCode} — ${SITE_NAME}`,
    description: `Browse flag assets related to ${countryCode} on ${SITE_NAME}.`,
    url,
    numberOfItems: productCount,
  };
}
