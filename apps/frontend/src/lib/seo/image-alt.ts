import { SITE_NAME } from './site-config';

/** Consistent alt text for product/flag imagery */
export function productImageAlt(productTitle: string, context?: 'thumbnail' | 'preview'): string {
  const bit = context === 'thumbnail' ? 'Thumbnail' : context === 'preview' ? 'Preview' : 'Image';
  return `${bit}: ${productTitle} — ${SITE_NAME}`;
}

export function categoryHeroAlt(categoryName: string): string {
  return `${categoryName} — browse flags on ${SITE_NAME}`;
}

export function countryHubAlt(countryCode: string): string {
  return `Flag assets for ${countryCode} — ${SITE_NAME}`;
}
