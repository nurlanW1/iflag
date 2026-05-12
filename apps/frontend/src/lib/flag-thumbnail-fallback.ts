/** Inline raster placeholder — avoids missing `/public/placeholder-flag.jpg` (404 ⇒ blank tiles). */
export const FLAG_THUMB_PLACEHOLDER_DATA_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">' +
      '<rect fill="#e8f2f4" width="160" height="120" rx="12"/>' +
      '<path fill="#006d7a" fill-opacity="0.2" d="M80 42l6 14h14l-12 10 5 14-13-10-13 10 5-14-12-10h14z"/>' +
      '</svg>',
  );

/** True when the gallery API fell back to the generic star tile (no real preview URL). */
export function isGenericFlagThumbPlaceholder(url: string | null | undefined): boolean {
  const t = url?.trim() ?? '';
  return t.length === 0 || t === FLAG_THUMB_PLACEHOLDER_DATA_URL;
}

function hueFromStableId(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
  }
  return Math.abs(h % 360);
}

/** Per-file hue so edition thumbnails don’t collapse to one identical “flat” star tile. */
export function flagThumbPlaceholderForFileId(fileId: string): string {
  const id = fileId.trim() || 'unknown';
  const h = hueFromStableId(id);
  const h2 = (h + 42) % 360;
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="hsl(${h} 38% 88%)"/><stop offset="100%" stop-color="hsl(${h2} 45% 78%)"/></linearGradient></defs>` +
        `<rect fill="url(#g)" width="160" height="120" rx="12"/>` +
        `<rect fill="hsl(${h} 55% 42%)" stroke="hsl(${h} 55% 28%)" stroke-width="1.5" x="28" y="44" width="104" height="32" rx="6" opacity="0.88"/>` +
        `</svg>`,
    )
  );
}
