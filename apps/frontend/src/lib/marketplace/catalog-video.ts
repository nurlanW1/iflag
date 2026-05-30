import { isFlagVideoFormat } from '@/lib/flag-video-formats';
import { SEED_IDS } from '@/services/marketplace/seed';
import type { Product } from '@/types/marketplace';

export function isVideoCatalogProduct(product: Product): boolean {
  if (product.categoryId === SEED_IDS.catFlagVideos) return true;
  if (product.files.length > 0 && product.files.every((f) => isFlagVideoFormat(f.format))) {
    return true;
  }
  return false;
}

export function isMockupCatalogProduct(product: Product): boolean {
  if (product.categoryId === SEED_IDS.catFlagMockups) return true;
  return false;
}

export function categoryIdForFlagFileFormat(
  format: string,
  countryCategoryId: string = SEED_IDS.catCountry,
  videoCategoryId: string = SEED_IDS.catFlagVideos,
  mockupCategoryId: string = SEED_IDS.catFlagMockups,
  designType?: string | null,
): string {
  if (isFlagVideoFormat(format)) return videoCategoryId;
  const dt = (designType ?? '').trim().toLowerCase();
  if (dt === 'mockup') return mockupCategoryId;
  if (format.trim().toLowerCase() === 'psd') return mockupCategoryId;
  return countryCategoryId;
}
