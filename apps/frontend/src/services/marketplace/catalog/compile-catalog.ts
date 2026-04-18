import { rowToProduct } from '@/lib/marketplace/product-schema';
import type { ProductFileRow, ProductRow } from '@/lib/marketplace/product-schema';
import type { Category, Product } from '@/types/marketplace';
import type { CatalogCategoryDraft, CatalogProductDraft } from './catalog-schema';
import { deterministicFileUuid } from './deterministic-ids';

function draftCategoryToCategory(d: CatalogCategoryDraft): Category {
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    kind: d.kind,
    isApproved: d.isApproved,
    parentId: d.parentId,
    displayOrder: d.displayOrder,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

/**
 * Turns validated JSON drafts into domain `Product[]` using the same row mapping a future DB repository will use.
 */
export function compileCatalogToProducts(
  categoryDrafts: CatalogCategoryDraft[],
  productDrafts: CatalogProductDraft[]
): { categories: Category[]; products: Product[] } {
  const categories = categoryDrafts.map(draftCategoryToCategory);
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  const productRows: ProductRow[] = [];
  const fileRows: ProductFileRow[] = [];
  const fallbackNow = new Date().toISOString();

  for (const d of productDrafts) {
    const cat = catBySlug.get(d.categorySlug);
    if (!cat) {
      throw new Error(`Invariant: missing category for slug ${d.categorySlug}`);
    }

    const createdAt = d.timestamps?.createdAt ?? fallbackNow;
    const updatedAt = d.timestamps?.updatedAt ?? createdAt;

    productRows.push({
      id: d.id,
      title: d.title,
      slug: d.slug,
      description: d.description ?? null,
      country_code: d.countryCode ?? null,
      region: d.region ?? null,
      category_id: cat.id,
      tags: d.tags,
      thumbnail_url: d.thumbnailUrl ?? null,
      preview_image_url: d.previewUrl ?? null,
      license_summary: d.license.summary,
      license_detail: d.license.detail ?? null,
      price_cents: d.pricing.priceCents,
      currency: d.pricing.currency,
      is_featured: d.flags.isFeatured,
      is_published: d.flags.isPublished,
      seo_meta_title: d.seo?.metaTitle ?? null,
      seo_meta_description: d.seo?.metaDescription ?? null,
      seo_canonical_path: d.seo?.canonicalPath ?? null,
      seo_og_image_url: d.seo?.ogImageUrl ?? null,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    for (const f of d.files) {
      const fileId = f.id ?? deterministicFileUuid(d.id, f.storageKey, f.sortOrder);
      fileRows.push({
        id: fileId,
        product_id: d.id,
        tier: f.tier,
        format: f.format,
        quality_label: f.qualityLabel,
        storage_key: f.storageKey,
        public_url: f.publicUrl ?? null,
        file_name: f.fileName,
        mime_type: f.mimeType,
        bytes: f.bytes ?? null,
        sort_order: f.sortOrder,
        created_at: createdAt,
        updated_at: updatedAt,
      });
    }
  }

  const products = productRows.map((row) => rowToProduct(row, fileRows));
  return { categories, products };
}
