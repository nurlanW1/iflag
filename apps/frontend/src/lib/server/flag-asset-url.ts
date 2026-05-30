/**
 * Canonical public URLs for gallery flag bytes (Neon rows → browser <img>/redirects).
 * Prefers Cloudflare `file_key` + `CLOUDFLARE_R2_PUBLIC_URL`; rewrites legacy Vercel Blob URLs to R2 when keys match on R2.
 */

import { isFlagVideoFormat } from '@/lib/flag-video-formats';
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
 * Display cascade for storefront previews:
 * `preview_url` → `thumbnail_url` → `file_url` (free / preview-safe assets only).
 * Premium originals must never be used as a browser preview fallback.
 */
export function previewDisplayUrlCandidates(input: {
  premiumTierRaw?: string | null;
  previewUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  fileUrl?: string | null | undefined;
}): string[] {
  const free = (input.premiumTierRaw ?? 'free').toLowerCase() === 'free';
  const safe = uniqStrings([input.previewUrl, input.thumbnailUrl]);
  if (free) {
    return uniqStrings([...safe, input.fileUrl]);
  }
  return safe;
}

/**
 * Country hub / list thumbnails — always allow preview + thumbnail URLs (covers WebP masters).
 * `file_url` is only appended when tier is free so paid originals stay gated.
 */
export function fallbackUrlsForGalleryListThumb(input: {
  premiumTierRaw?: string | null;
  fileUrl?: string | null | undefined;
  previewUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
}): string[] {
  const safe = uniqStrings([input.previewUrl, input.thumbnailUrl]);
  const free = (input.premiumTierRaw ?? 'free').toLowerCase() === 'free';
  if (free) {
    return uniqStrings([...safe, input.fileUrl]);
  }
  return safe.length > 0 ? safe : uniqStrings([input.fileUrl]);
}

const RASTER_THUMB_FORMATS = new Set(['webp', 'png', 'jpg', 'jpeg', 'svg']);

/**
 * Gallery design tiles — show raster/WebP masters in `<img>` even when tier is paid
 * (download stays gated; preview bytes are already public on R2).
 */
export function galleryVariantThumbCandidates(input: {
  format?: string | null;
  premiumTierRaw?: string | null;
  fileUrl?: string | null | undefined;
  previewUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
}): string[] {
  const fmt = (input.format ?? '').trim().toLowerCase();
  const safe = uniqStrings([input.previewUrl, input.thumbnailUrl]);
  if (RASTER_THUMB_FORMATS.has(fmt)) {
    return uniqStrings([...safe, input.fileUrl]);
  }
  return fallbackUrlsForGalleryListThumb(input);
}

/**
 * Browser playback URL for MP4/WebM/MOV — includes public `file_url` / R2 key
 * (stream preview on site; download stays gated separately).
 */
export function galleryVariantPlaybackCandidates(input: {
  format?: string | null;
  premiumTierRaw?: string | null;
  fileUrl?: string | null | undefined;
  previewUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
}): string[] {
  const fmt = (input.format ?? '').trim().toLowerCase();
  if (!isFlagVideoFormat(fmt)) {
    return galleryVariantThumbCandidates(input);
  }
  const safe = uniqStrings([input.previewUrl, input.thumbnailUrl]);
  return uniqStrings([...safe, input.fileUrl]);
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
