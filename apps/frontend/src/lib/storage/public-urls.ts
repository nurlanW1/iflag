import { getR2PublicAssetsBaseUrl } from './r2-config';

/**
 * Reject path traversal and obvious abuse; keys are R2 object keys, not full URLs.
 */
export function assertSafeObjectKey(key: string): string {
  const k = key.trim().replace(/^\/+/, '');
  if (!k || k.length > 1024) {
    throw new Error('Invalid storage key');
  }
  if (k.includes('..') || k.startsWith('\\')) {
    throw new Error('Invalid storage key: path traversal');
  }
  return k;
}

/**
 * Build a public HTTPS URL for an object served from a **public** R2 bucket or CDN.
 * Returns `null` if no public base is configured — caller may fall back to stored absolute URLs.
 */
export function buildPublicR2ObjectUrl(storageKey: string): string | null {
  const base = getR2PublicAssetsBaseUrl();
  if (!base) return null;
  const k = assertSafeObjectKey(storageKey);
  const path = k.split('/').map(encodeURIComponent).join('/');
  return `${base}/${path}`;
}
