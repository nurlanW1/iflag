import type { Product } from '@/types/marketplace';
import { isPaidCatalogProduct } from '@/lib/marketplace/catalog-utils';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import { getSiteOrigin } from '@/lib/seo/site-config';

/**
 * Image URL for Open Graph / Twitter / Google rich results.
 * Premium designs use a server-rendered OG image with watermark baked in.
 */
export function productShareImageUrl(product: Product): string | undefined {
  const raw =
    product.seo.ogImageUrl?.trim() ||
    product.previewUrl?.trim() ||
    product.thumbnailUrl?.trim() ||
    '';
  if (!raw) return undefined;

  const paid = isPaidCatalogProduct(toPublicProduct(product));
  if (!paid) return raw;

  const origin = getSiteOrigin();
  const q = new URLSearchParams({
    src: raw,
    title: product.title.slice(0, 120),
  });
  return `${origin}/api/og/flag?${q.toString()}`;
}
