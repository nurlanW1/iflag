/** WebP (and future lightweight rasters) are hub covers / gallery previews only — not downloadable masters. */
export const PREVIEW_ONLY_FORMATS = new Set(['webp']);

export function isPreviewOnlyFormat(format: string | null | undefined): boolean {
  const f = (format ?? '').trim().toLowerCase();
  return f.length > 0 && PREVIEW_ONLY_FORMATS.has(f);
}
