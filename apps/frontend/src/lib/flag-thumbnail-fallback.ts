/** Inline raster placeholder — avoids missing `/public/placeholder-flag.jpg` (404 ⇒ blank tiles). */
export const FLAG_THUMB_PLACEHOLDER_DATA_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">' +
      '<rect fill="#e8f2f4" width="160" height="120" rx="12"/>' +
      '<path fill="#006d7a" fill-opacity="0.2" d="M80 42l6 14h14l-12 10 5 14-13-10-13 10 5-14-12-10h14z"/>' +
      '</svg>',
  );
