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

export function categoryIdForFlagFileFormat(
  format: string,
  countryCategoryId: string = SEED_IDS.catCountry,
  videoCategoryId: string = SEED_IDS.catFlagVideos,
): string {
  return isFlagVideoFormat(format) ? videoCategoryId : countryCategoryId;
}
