/**
 * Pro-tier file identity for R2 object keys — included on full `Product` only.
 * Never serialize to `PublicProduct` or public catalog JSON.
 */
export interface ProFileKeyDescriptor {
  fileId: string;
  format: string;
  qualityLabel: string;
  /** R2 object key (private bucket) — server-side only */
  storageKey: string;
}
