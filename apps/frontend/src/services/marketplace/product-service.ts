import { getMarketplaceStore } from './memory-store';
import type { Product } from '@/types/marketplace';

export interface ProductListFilters {
  categoryId?: string;
  featuredOnly?: boolean;
}

export type CatalogSort = 'newest' | 'oldest' | 'title' | 'popular';

export interface CatalogQuery {
  categoryId?: string;
  featured?: boolean;
  search?: string;
  /** Products with a public free-download URL */
  hasFreeDownload?: boolean;
  tier?: 'all' | 'free' | 'pro';
  sort?: CatalogSort;
  page?: number;
  limit?: number;
}

export function listPublishedProducts(filters: ProductListFilters = {}): Product[] {
  const { productsById } = getMarketplaceStore();
  let list = [...productsById.values()].filter((p) => p.isPublished);
  if (filters.categoryId) {
    list = list.filter((p) => p.categoryId === filters.categoryId);
  }
  if (filters.featuredOnly) {
    list = list.filter((p) => p.isFeatured);
  }
  return list.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Filter, sort, and paginate the in-memory catalog (swap for DB queries later).
 */
export function queryCatalog(q: CatalogQuery): { products: Product[]; total: number } {
  let list = listPublishedProducts({});

  if (q.categoryId) {
    list = list.filter((p) => p.categoryId === q.categoryId);
  }
  if (q.featured) {
    list = list.filter((p) => p.isFeatured);
  }
  if (q.hasFreeDownload) {
    list = list.filter((p) => p.freeDownloadUrl != null && p.freeDownloadUrl.trim() !== '');
  }

  const search = q.search?.trim().toLowerCase();
  if (search) {
    list = list.filter((p) => {
      return (
        p.title.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search) ||
        p.tags.some((t) => t.toLowerCase().includes(search)) ||
        (p.countryCode?.toLowerCase().includes(search) ?? false)
      );
    });
  }

  if (q.tier === 'free') {
    list = list.filter((p) => p.priceCents === 0);
  } else if (q.tier === 'pro') {
    list = list.filter((p) => p.priceCents > 0 || p.proFileKeys.length > 0);
  }

  const sort: CatalogSort = q.sort ?? 'newest';
  const sorted = [...list];
  switch (sort) {
    case 'newest':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'popular':
      sorted.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
      break;
    default:
      break;
  }

  const total = sorted.length;
  const limit = Math.min(Math.max(q.limit ?? 24, 1), 48);
  const page = Math.max(q.page ?? 1, 1);
  const start = (page - 1) * limit;
  const products = sorted.slice(start, start + limit);
  return { products, total };
}

export function getProductBySlug(slug: string): Product | null {
  const { productsBySlug } = getMarketplaceStore();
  const p = productsBySlug.get(slug);
  if (!p || !p.isPublished) return null;
  return p;
}

export function getProductById(id: string): Product | null {
  const { productsById } = getMarketplaceStore();
  const p = productsById.get(id);
  return p ?? null;
}
