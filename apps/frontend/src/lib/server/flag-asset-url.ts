/**
 * Canonical public URLs for gallery flag bytes (Neon rows → browser <img>/redirects).
 * Prefers Cloudflare `file_key` + `CLOUDFLARE_R2_PUBLIC_URL`; rewrites legacy Vercel Blob URLs to R2 when keys match on R2.
 */

import { getPublicR2FileUrl } from '@/lib/server/cloudflare-r2';
import { resolveGalleryAssetUrl } from '@/lib/server/blob-site-proxy';

/** Ordered unique strings (preserve first occurrence). */
function uniqStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const s = v?.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * Country list thumbnails: prefer R2/canonical URLs for **free** rows (`file_url` before stale blob previews).
 * **Paid/freemium** must not advertise `file_url` in grid (preview/thumb only), matching Neon policy.
 */
export function fallbackUrlsForGalleryListThumb(input: {
  premiumTierRaw?: string | null;
  fileUrl?: string | null | undefined;
  previewUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
}): string[] {
  const free = (input.premiumTierRaw ?? 'free').toLowerCase() === 'free';
  if (free) {
    return uniqStrings([input.fileUrl, input.previewUrl, input.thumbnailUrl]);
  }
  return uniqStrings([input.previewUrl, input.thumbnailUrl]);
}

/**
 * Pick the best HTTPS/data URL for a published `country_flag_files` row.
 * Order: R2 derived from `file_key` → preview_url → image file_url chain (handled by callers) …
 *
 * Pass fallbacks newest-first matching your SQL CASE order.
 */
export function resolvedFlagPublicHref(input: {
  fileKey?: string | null | undefined;
  /** Raw DB strings in priority order (e.g. preview, thumb, then file_url). */
  fallbackRawUrls: Array<string | null | undefined>;
}): string {
  const key = input.fileKey?.trim();
  if (key) {
    const href = getPublicR2FileUrl(key);
    if (href) return resolveGalleryAssetUrl(href);
  }
  for (const raw of input.fallbackRawUrls) {
    const s = raw?.trim();
    if (!s) continue;
    const out = resolveGalleryAssetUrl(s);
    if (out) return out;
  }
  return '';
}
