import type { Product, ProductFile } from '@/types/marketplace';

/**
 * Product as exposed on public catalog API — no pro storage keys or non-public pro URLs.
 */
export interface PublicProductFile {
  id: string;
  tier: ProductFile['tier'];
  format: string;
  qualityLabel: string;
  fileName: string;
  mimeType: string;
  bytes: number | null;
  sortOrder: number;
  /** Always null — use gated `/api/marketplace/files/.../download` (raw CDN URLs are not exposed). */
  downloadUrl: null;
}

export interface PublicProduct {
  id: string;
  title: string;
  slug: string;
  /** When set, catalog cards link here instead of `/flags/{slug}`. */
  detailHref?: string | null;
  /** Denormalized hyphenated country slug for Neon-derived cards */
  countrySlug?: string | null;
  /** Stable design key shared across formats (Neon grouping). */
  assetGroupKey?: string | null;
  description: string | null;
  countryCode: string | null;
  region: string | null;
  categoryId: string;
  tags: string[];
  thumbnailUrl: string | null;
  previewUrl: string | null;
  /**
   * Always null in API responses — preview files use the gated download route only.
   * @deprecated Prefer `hasPreviewDownload`.
   */
  freeDownloadUrl: null;
  /** Product has a preview file that can be downloaded after auth + entitlement. */
  hasPreviewDownload: boolean;
  files: PublicProductFile[];
  license: Product['license'];
  priceCents: number;
  currency: string;
  isFeatured: boolean;
  seo: Product['seo'];
  createdAt: string;
  updatedAt: string;
}

function toPublicFile(f: ProductFile): PublicProductFile {
  return {
    id: f.id,
    tier: f.tier,
    format: f.format,
    qualityLabel: f.qualityLabel,
    fileName: f.fileName,
    mimeType: f.mimeType,
    bytes: f.bytes,
    sortOrder: f.sortOrder,
    downloadUrl: null,
  };
}

export function toPublicProduct(p: Product): PublicProduct {
  const hasPreviewDownload = p.files.some(
    (f) =>
      f.tier === 'preview_free' && f.publicUrl != null && String(f.publicUrl).trim() !== ''
  );
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    detailHref: p.detailPath?.trim() || null,
    countrySlug: p.countrySlug?.trim() || null,
    assetGroupKey: p.assetGroupKey?.trim() || null,
    description: p.description,
    countryCode: p.countryCode,
    region: p.region,
    categoryId: p.categoryId,
    tags: p.tags,
    thumbnailUrl: p.thumbnailUrl,
    previewUrl: p.previewUrl,
    freeDownloadUrl: null,
    hasPreviewDownload,
    files: p.files.map(toPublicFile),
    license: p.license,
    priceCents: p.priceCents,
    currency: p.currency,
    isFeatured: p.isFeatured,
    seo: p.seo,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
