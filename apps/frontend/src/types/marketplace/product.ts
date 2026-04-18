import type { ISODateString } from './common';
import type { ProFileKeyDescriptor } from './pro-file';
import type { ProductFile } from './product-file';

export interface ProductSeo {
  metaTitle: string | null;
  metaDescription: string | null;
  /** Path only, e.g. /flags/usa — host comes from deployment */
  canonicalPath: string | null;
  ogImageUrl: string | null;
}

export interface ProductLicenseInfo {
  /** Short label shown in UI, e.g. "Personal & commercial" */
  summary: string;
  /** Longer legal / usage text; can reference external URL later */
  detail: string | null;
}

/**
 * Domain Product — flag asset offered in the marketplace.
 */
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  /** ISO 3166-1 alpha-2/alpha-3 as stored; validation layer can normalize later */
  countryCode: string | null;
  region: string | null;
  categoryId: string;
  /** Denormalized tag slugs or labels for display; DB may use junction table */
  tags: string[];
  /** Marketing / gallery thumbnail (HTTPS URL or public R2/CDN). Safe for public pages. */
  thumbnailUrl: string | null;
  /** Large preview image for product detail (HTTPS URL or public R2/CDN). Safe for public pages. */
  previewUrl: string | null;
  /**
   * Canonical public URL for the low-quality downloadable preview file.
   * Built from `preview_free` file `publicUrl` or public R2 base + key.
   * Safe for anonymous users when your license allows free preview distribution.
   */
  freeDownloadUrl: string | null;
  /**
   * Pro master files in private R2 — keys for server-side presign / worker only.
   * Derived from `files` where `tier === 'pro'`.
   */
  proFileKeys: ProFileKeyDescriptor[];
  files: ProductFile[];
  license: ProductLicenseInfo;
  priceCents: number;
  currency: string;
  isFeatured: boolean;
  isPublished: boolean;
  seo: ProductSeo;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
