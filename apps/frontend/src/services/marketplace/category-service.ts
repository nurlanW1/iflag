import { getMarketplaceStore } from './memory-store';
import type { Category } from '@/types/marketplace';

export function listCategories(): Category[] {
  const { categories } = getMarketplaceStore();
  return [...categories.values()].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getCategoryBySlug(slug: string): Category | null {
  return listCategories().find((c) => c.slug === slug) ?? null;
}

export function getCategoryById(id: string): Category | null {
  const { categories } = getMarketplaceStore();
  return categories.get(id) ?? null;
}
