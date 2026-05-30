/**
 * Shared preview rules for gallery + PDP (safe on client and server).
 */

import { isFlagVideoFormat } from '@/lib/flag-video-formats';

export const NON_BROWSER_MASTER_FORMATS = new Set(['eps', 'pdf', 'ai', 'psd']);

const CARD_COVER_FORMAT_PRIORITY = ['png', 'jpg', 'jpeg', 'webp', 'svg'] as const;

export function hrefLooksLikeNonBrowserMaster(url: string | null | undefined): boolean {
  const u = (url ?? '').trim();
  if (!u) return false;
  return /\.(eps|pdf|ai|psd)(?:$|[?#])/i.test(u);
}

export function isBrowserDisplayableFlagFormat(format: string | null | undefined): boolean {
  const f = (format ?? '').trim().toLowerCase();
  if (!f || NON_BROWSER_MASTER_FORMATS.has(f)) return false;
  return ['webp', 'png', 'jpg', 'jpeg', 'svg', 'gif'].includes(f) || isFlagVideoFormat(f);
}

function formatKey(f: { format: string; formatCode?: string }): string {
  return (f.formatCode ?? f.format).trim().toLowerCase();
}

/** Prefer PNG/JPG/WebP/SVG preview for a grouped design card. */
export function pickFormatPreviewUrl(
  formats: ReadonlyArray<{ format: string; formatCode?: string; previewUrl?: string | null }>,
  fallbackUrls: string[] = [],
): string {
  const ok = (url: string | undefined | null, format?: string) => {
    const u = (url ?? '').trim();
    if (!u || hrefLooksLikeNonBrowserMaster(u)) return false;
    const fc = (format ?? '').toLowerCase();
    if (fc && NON_BROWSER_MASTER_FORMATS.has(fc) && hrefLooksLikeNonBrowserMaster(u)) return false;
    return true;
  };

  for (const code of CARD_COVER_FORMAT_PRIORITY) {
    const row = formats.find((f) => {
      const fmt = formatKey(f);
      return fmt === code || (code === 'jpeg' && fmt === 'jpg') || (code === 'jpg' && fmt === 'jpeg');
    });
    if (row && ok(row.previewUrl, formatKey(row))) return row.previewUrl!.trim();
  }

  for (const raw of fallbackUrls) {
    if (ok(raw)) return raw.trim();
  }

  return '';
}
