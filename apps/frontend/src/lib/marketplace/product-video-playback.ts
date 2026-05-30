import { hrefLooksLikeFlagVideo, isFlagVideoFormat } from '@/lib/flag-video-formats';
import type { Product } from '@/types/marketplace';

export type ProductVideoPlayback = {
  videoUrl: string;
  posterUrl: string | null;
  format: string;
};

/** First streamable video on a marketplace product (PDP / cards). */
export function productVideoPlayback(product: Product): ProductVideoPlayback | null {
  const candidates: Array<{ url: string; format: string }> = [];

  for (const f of product.files) {
    if (!isFlagVideoFormat(f.format)) continue;
    const url = f.publicUrl?.trim();
    if (url) candidates.push({ url, format: f.format });
  }

  for (const url of [product.previewUrl, product.thumbnailUrl]) {
    const u = url?.trim();
    if (u && hrefLooksLikeFlagVideo(u)) {
      const ext = u.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'mp4';
      candidates.push({ url: u, format: ext });
    }
  }

  const hit = candidates.find((c) => c.url.length > 0);
  if (!hit) return null;

  const poster =
    [product.thumbnailUrl, product.previewUrl]
      .map((u) => u?.trim())
      .find((u) => u && !hrefLooksLikeFlagVideo(u)) ?? null;

  return {
    videoUrl: hit.url,
    posterUrl: poster,
    format: hit.format,
  };
}

export function productIsVideoPrimary(product: Product): boolean {
  const masters = product.files.filter((f) => f.format.toLowerCase() !== 'webp');
  if (masters.length === 0) return hrefLooksLikeFlagVideo(product.previewUrl);
  return masters.every((f) => isFlagVideoFormat(f.format));
}
