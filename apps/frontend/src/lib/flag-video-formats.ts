/** Downloadable flag video masters (country folders + Flag videos hub). */
export const FLAG_VIDEO_FORMATS = new Set(['mp4', 'webm', 'mov']);

export function isFlagVideoFormat(format: string | null | undefined): boolean {
  const f = (format ?? '').trim().toLowerCase();
  return f.length > 0 && FLAG_VIDEO_FORMATS.has(f);
}

export function isFlagVideoDesignType(designType: string | null | undefined): boolean {
  return (designType ?? '').trim().toLowerCase() === 'video';
}
