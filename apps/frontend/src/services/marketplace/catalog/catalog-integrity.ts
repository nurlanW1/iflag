import type { CatalogCategoryDraft, CatalogProductDraft } from './catalog-schema';

export function assertUniqueSlugs<T extends { slug: string }>(items: T[], label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.slug)) {
      throw new Error(`Catalog error: duplicate ${label} slug "${item.slug}"`);
    }
    seen.add(item.slug);
  }
}

export function assertUniqueIds<T extends { id: string }>(items: T[], label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Catalog error: duplicate ${label} id "${item.id}"`);
    }
    seen.add(item.id);
  }
}

export function assertProductCategoryRefs(
  products: CatalogProductDraft[],
  categories: CatalogCategoryDraft[]
): void {
  const slugs = new Set(categories.map((c) => c.slug));
  for (const p of products) {
    if (!slugs.has(p.categorySlug)) {
      throw new Error(
        `Catalog error: product "${p.slug}" uses unknown categorySlug "${p.categorySlug}". ` +
          `Add the category to content/catalog/categories.json or fix the slug.`
      );
    }
  }
}
