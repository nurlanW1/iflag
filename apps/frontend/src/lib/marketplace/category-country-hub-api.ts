import type { Category } from '@/types/marketplace';

const KIND_TO_GALLERY_QUERY: Partial<Record<string, string>> = {
  country_flags: '/api/gallery/countries',
  autonomy_flags: '/api/gallery/countries?kind=autonomy',
  historical_flags: '/api/gallery/countries?kind=historical',
  organization_flags: '/api/gallery/countries?kind=organizations',
  institution_flags: '/api/gallery/countries?kind=organizations',
};

/** Categories that list country folders (not individual product cards). */
export function categoryUsesCountryHubGrid(category: Category): boolean {
  return Boolean(category.kind && KIND_TO_GALLERY_QUERY[category.kind]);
}

export function galleryApiPathForCategory(category: Category): string {
  return KIND_TO_GALLERY_QUERY[category.kind ?? ''] ?? '/api/gallery/countries';
}
