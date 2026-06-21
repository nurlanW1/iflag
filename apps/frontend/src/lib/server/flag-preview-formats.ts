/** Formats that are preview-only (not downloadable). Currently none — all R2 files are freely downloadable. */
export const PREVIEW_ONLY_FORMATS = new Set<string>();

export function isPreviewOnlyFormat(format: string | null | undefined): boolean {
  const f = (format ?? '').trim().toLowerCase();
  return f.length > 0 && PREVIEW_ONLY_FORMATS.has(f);
}
