/** Raster extensions commonly used for CDN flag previews */
const RASTER_EXT = /\.(?:png|jpe?g|webp|gif|avif)(?:$|[/?#])/i;

function pathnameOfHref(href: string): string {
  try {
    return new URL(href, 'https://example.invalid').pathname;
  } catch {
    return '';
  }
}

/**
 * SVG (and bare vector previews without a raster extension) break or are blocked by default
 * `next/image` remote optimization. Skip the optimizer so the browser renders them natively.
 */
export function shouldUnoptimizeFlagImageHref(
  href: string,
  formatHints?: Iterable<string> | null | undefined,
): boolean {
  if (!href) return false;
  const lower = href.toLowerCase().trim();
  if (lower.startsWith('data:')) {
    return /^data:image\/svg\+xml/i.test(lower);
  }
  const path = pathnameOfHref(href);
  if (/\.svg(?:$|[/?#])/i.test(path)) return true;
  const hints = [...(formatHints ?? [])].map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (hints.includes('svg') && !RASTER_EXT.test(path)) return true;
  return false;
}
