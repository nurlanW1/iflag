/**
 * DB-oriented shapes (snake_case) for a future PostgreSQL mapping.
 * Domain types in @/types/marketplace use camelCase — map at the repository layer.
 */

import { deriveFreeDownloadUrl, deriveProFileKeys } from '@/lib/storage/product-derivations';
import type { Product, ProductFile, ProductLicenseInfo, ProductSeo } from '@/types/marketplace';

/** Aligns with a likely `products` table */
export interface ProductRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  country_code: string | null;
  region: string | null;
  category_id: string;
  tags: string[];
  thumbnail_url: string | null;
  preview_image_url: string | null;
  license_summary: string;
  license_detail: string | null;
  price_cents: number;
  currency: string;
  is_featured: boolean;
  is_published: boolean;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  seo_canonical_path: string | null;
  seo_og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Aligns with `product_files` */
export interface ProductFileRow {
  id: string;
  product_id: string;
  tier: 'preview_free' | 'pro';
  format: string;
  quality_label: string;
  storage_key: string;
  public_url: string | null;
  file_name: string;
  mime_type: string;
  bytes: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const PRODUCT_TABLE_COLUMNS = [
  'id',
  'title',
  'slug',
  'description',
  'country_code',
  'region',
  'category_id',
  'tags',
  'thumbnail_url',
  'preview_image_url',
  'license_summary',
  'license_detail',
  'price_cents',
  'currency',
  'is_featured',
  'is_published',
  'seo_meta_title',
  'seo_meta_description',
  'seo_canonical_path',
  'seo_og_image_url',
  'created_at',
  'updated_at',
] as const;

export const PRODUCT_FILE_TABLE_COLUMNS = [
  'id',
  'product_id',
  'tier',
  'format',
  'quality_label',
  'storage_key',
  'public_url',
  'file_name',
  'mime_type',
  'bytes',
  'sort_order',
  'created_at',
  'updated_at',
] as const;

export function rowToProduct(row: ProductRow, files: ProductFileRow[]): Product {
  const license: ProductLicenseInfo = {
    summary: row.license_summary,
    detail: row.license_detail,
  };
  const seo: ProductSeo = {
    metaTitle: row.seo_meta_title,
    metaDescription: row.seo_meta_description,
    canonicalPath: row.seo_canonical_path,
    ogImageUrl: row.seo_og_image_url,
  };
  const mappedFiles: ProductFile[] = files.filter((f) => f.product_id === row.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(fileRowToProductFile);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    countryCode: row.country_code,
    region: row.region,
    categoryId: row.category_id,
    tags: row.tags,
    thumbnailUrl: row.thumbnail_url,
    previewUrl: row.preview_image_url,
    freeDownloadUrl: deriveFreeDownloadUrl(mappedFiles),
    proFileKeys: deriveProFileKeys(mappedFiles),
    files: mappedFiles,
    license,
    priceCents: row.price_cents,
    currency: row.currency,
    isFeatured: row.is_featured,
    isPublished: row.is_published,
    seo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fileRowToProductFile(r: ProductFileRow): ProductFile {
  return {
    id: r.id,
    productId: r.product_id,
    tier: r.tier,
    format: r.format,
    qualityLabel: r.quality_label,
    storageKey: r.storage_key,
    publicUrl: r.public_url,
    fileName: r.file_name,
    mimeType: r.mime_type,
    bytes: r.bytes,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function productToRow(p: Product): ProductRow {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    country_code: p.countryCode,
    region: p.region,
    category_id: p.categoryId,
    tags: p.tags,
    thumbnail_url: p.thumbnailUrl,
    preview_image_url: p.previewUrl,
    license_summary: p.license.summary,
    license_detail: p.license.detail,
    price_cents: p.priceCents,
    currency: p.currency,
    is_featured: p.isFeatured,
    is_published: p.isPublished,
    seo_meta_title: p.seo.metaTitle,
    seo_meta_description: p.seo.metaDescription,
    seo_canonical_path: p.seo.canonicalPath,
    seo_og_image_url: p.seo.ogImageUrl,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function productFileToRow(f: ProductFile): ProductFileRow {
  return {
    id: f.id,
    product_id: f.productId,
    tier: f.tier,
    format: f.format,
    quality_label: f.qualityLabel,
    storage_key: f.storageKey,
    public_url: f.publicUrl,
    file_name: f.fileName,
    mime_type: f.mimeType,
    bytes: f.bytes,
    sort_order: f.sortOrder,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  };
}
