/** Downloadable flag video masters (country folders + Flag videos hub). */
export const FLAG_VIDEO_FORMATS = new Set(['mp4', 'webm', 'mov']);

export function isFlagVideoFormat(format: string | null | undefined): boolean {
  const f = (format ?? '').trim().toLowerCase();
  return f.length > 0 && FLAG_VIDEO_FORMATS.has(f);
}

export function isFlagVideoDesignType(designType: string | null | undefined): boolean {
  return (designType ?? '').trim().toLowerCase() === 'video';
}

/** Public CDN href points at a streamable video master (not a raster poster). */
export function hrefLooksLikeFlagVideo(href: string | null | undefined): boolean {
  const s = href?.trim();
  if (!s) return false;
  try {
    const path = new URL(s, 'https://iflag.invalid').pathname;
    const ext = path.split('.').pop()?.split('?')[0] ?? '';
    return isFlagVideoFormat(ext);
  } catch {
    return /\.(mp4|webm|mov)(\?|#|$)/i.test(s);
  }
}

export function mimeForFlagVideoFormat(format: string | null | undefined): string {
  const f = (format ?? '').trim().toLowerCase();
  if (f === 'webm') return 'video/webm';
  if (f === 'mov') return 'video/quicktime';
  return 'video/mp4';
}
