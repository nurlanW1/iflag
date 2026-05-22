import type { Product } from '@/types/marketplace';
import { getProductBySlug } from '@/services/marketplace';
import { getNeonCatalogProductBySlug } from '@/lib/server/neon-catalog';

/** In-browser catalog merged with Neon R2-backed rows (server-only). */
export async function resolvePublishedMarketplaceProduct(slug: string): Promise<Product | null> {
  const seeded = getProductBySlug(slug);
  if (seeded) return seeded;
  try {
    return await getNeonCatalogProductBySlug(slug);
  } catch {
    return null;
  }
}
