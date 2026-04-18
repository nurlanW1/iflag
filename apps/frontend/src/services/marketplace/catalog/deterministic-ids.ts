import { createHash } from 'node:crypto';

/**
 * Stable UUID-shaped id for product files when JSON omits `id`.
 * Same inputs always yield the same id (safe for presign, webhooks, and reproducible builds).
 */
export function deterministicFileUuid(productId: string, storageKey: string, sortOrder: number): string {
  const h = createHash('sha256')
    .update('iflag:catalog:product-file:v1')
    .update('\0')
    .update(productId)
    .update('\0')
    .update(storageKey)
    .update('\0')
    .update(String(sortOrder))
    .digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = b.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
