import type { ISODateString } from './common';

/**
 * preview_free — low quality, may be exposed as public CDN URL on product pages.
 * pro — full quality; storage key only on server; never send presigned URL without auth + entitlement.
 */
export type ProductFileTier = 'preview_free' | 'pro';

export interface ProductFile {
  id: string;
  productId: string;
  tier: ProductFileTier;
  /** e.g. svg, png, pdf */
  format: string;
  qualityLabel: string;
  /**
   * R2 (or S3-compatible) object key, relative to bucket — not a full URL.
   * Example: flags/{productId}/pro/vector.svg
   */
  storageKey: string;
  /**
   * Optional public HTTPS URL for preview assets (CDN or R2 public bucket).
   * For pro tier this must stay null/undefined in API responses unless authorized.
   */
  publicUrl: string | null;
  fileName: string;
  mimeType: string;
  bytes: number | null;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
