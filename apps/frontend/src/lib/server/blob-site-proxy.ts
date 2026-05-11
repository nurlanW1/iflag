/** Only allow `flags/{safe-filename}.{ext}` — mirrors `/api/asset` validator. */
export const FLAGS_STORAGE_PATH_RE =
  /^flags\/[a-zA-Z0-9.\-_]+\.[a-zA-Z0-9]{2,8}$/;

/** Convert Vercel Blob public URLs to same-origin `/api/asset` redirects (better branding). */
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
 * Rewrite known `*.public.blob.vercel-storage.com` URLs to `/api/asset?path=…` when
 * `BLOB_PUBLIC_BASE_URL` is set server-side — browser shows your domain instead of Blob host.
 */
export function siteProxiedBlobUrl(blobOrAnyUrl: string): string {
  const s = blobOrAnyUrl?.trim() ?? '';
  if (!s || s.startsWith('data:') || s.startsWith('/')) return s || '';
  if (!/^https?:\/\//i.test(s)) return s;

  const base = process.env.BLOB_PUBLIC_BASE_URL?.trim();
  if (!base) return s;

  const path = blobPathFromPublicStorageUrl(s);
  if (!path || !FLAGS_STORAGE_PATH_RE.test(path)) return s;

  return `/api/asset?path=${encodeURIComponent(path)}`;
}
