/**
 * R2/Blob object keys under `flags/…` (nested paths supported, e.g. `flags/uz/name/file.svg`).
 * Used to validate rewritten URLs and `/api/asset` paths — disallow path traversal.
 */
export const FLAGS_STORAGE_PATH_RE = /^flags\/[a-zA-Z0-9.\/_\-]+$/;

export function isSafePublicFlagObjectPath(path: string): boolean {
  const p = path.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
  if (!p || p.includes('..')) return false;
  return FLAGS_STORAGE_PATH_RE.test(p);
}

function publicR2BaseFromEnv(): string | null {
  const pub =
    process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() ||
    process.env.R2_PUBLIC_URL?.trim() ||
    '';
  return pub ? pub.replace(/\/+$/, '') : null;
}

/**
 * If legacy Vercel Blob URL pointed at key `flags/…` on Blob and the same keys now exist on R2,
 * map to `CLOUDFLARE_R2_PUBLIC_URL/flags/…`.
 */
export function rewriteVercelBlobUrlToR2PublicIfConfigured(blobOrHttpsUrl: string): string | null {
  const s = blobOrHttpsUrl?.trim();
  if (!s) return null;
  const pub = publicR2BaseFromEnv();
  if (!pub) return null;
  const key = blobPathFromPublicStorageUrl(s);
  if (!key || !isSafePublicFlagObjectPath(key)) return null;
  return `${pub}/${key}`;
}

/** Extract object path from legacy Vercel Blob public URLs (`*.blob.vercel-storage.com`). */
export function blobPathFromPublicStorageUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (!/\bblob\.vercel-storage\.com$/i.test(u.hostname)) return null;
    return decodeURIComponent(u.pathname.replace(/^\/+/, '').replace(/\/{2,}/g, '/'));
  } catch {
    return null;
  }
}

/**
 * Legacy: rewrite `*.public.blob.vercel-storage.com` to same-origin `/api/asset?path=…`
 * when `BLOB_PUBLIC_BASE_URL` is set.
 *
 * For Cloudflare R2 and other HTTPS URLs, returns the URL unchanged (use `<img src>` directly).
 */
export function siteProxiedBlobUrl(blobOrAnyUrl: string): string {
  return resolveGalleryAssetUrl(blobOrAnyUrl);
}

/** Resolve gallery/display URLs — prefer Cloudflare R2 public base over legacy Blob. */
export function resolveGalleryAssetUrl(raw: string): string {
  const s = raw?.trim() ?? '';
  if (!s || s.startsWith('data:') || s.startsWith('/')) return s || '';
  if (!/^https?:\/\//i.test(s)) return s;

  const r2Direct = rewriteVercelBlobUrlToR2PublicIfConfigured(s);
  if (r2Direct) return r2Direct;

  const base = process.env.BLOB_PUBLIC_BASE_URL?.trim();
  if (!base) return s;

  const path = blobPathFromPublicStorageUrl(s);
  if (!path || !isSafePublicFlagObjectPath(path)) return s;

  return `/api/asset?path=${encodeURIComponent(path)}`;
}
