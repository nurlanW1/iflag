/** Only allow `flags/{safe-filename}.{ext}` — mirrors `/api/asset` validator for legacy Blob paths. */
export const FLAGS_STORAGE_PATH_RE =
  /^flags\/[a-zA-Z0-9.\-_]+\.[a-zA-Z0-9]{2,8}$/;

/** Extract pathname from public Vercel Blob URLs (legacy). */
export function blobPathFromPublicStorageUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (!/\.public\.blob\.vercel-storage\.com$/i.test(u.hostname)) return null;
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

/** Prefer same-origin proxy only for legacy Vercel Blob public URLs. */
export function resolveGalleryAssetUrl(raw: string): string {
  const s = raw?.trim() ?? '';
  if (!s || s.startsWith('data:') || s.startsWith('/')) return s || '';
  if (!/^https?:\/\//i.test(s)) return s;

  const base = process.env.BLOB_PUBLIC_BASE_URL?.trim();
  if (!base) return s;

  const path = blobPathFromPublicStorageUrl(s);
  if (!path || !FLAGS_STORAGE_PATH_RE.test(path)) return s;

  return `/api/asset?path=${encodeURIComponent(path)}`;
}
