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
  /** Only set for preview_free when a public URL exists */
  downloadUrl: string | null;
}

export interface PublicProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  countryCode: string | null;
  region: string | null;
  categoryId: string;
  tags: string[];
  thumbnailUrl: string | null;
  previewUrl: string | null;
  /** Public low-quality download — never set pro master URLs here */
  freeDownloadUrl: string | null;
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
  const isPreview = f.tier === 'preview_free';
  return {
    id: f.id,
    tier: f.tier,
    format: f.format,
    qualityLabel: f.qualityLabel,
    fileName: f.fileName,
    mimeType: f.mimeType,
    bytes: f.bytes,
    sortOrder: f.sortOrder,
    downloadUrl: isPreview ? f.publicUrl : null,
  };
}

export function toPublicProduct(p: Product): PublicProduct {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    countryCode: p.countryCode,
    region: p.region,
    categoryId: p.categoryId,
    tags: p.tags,
    thumbnailUrl: p.thumbnailUrl,
    previewUrl: p.previewUrl,
    freeDownloadUrl: p.freeDownloadUrl,
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
