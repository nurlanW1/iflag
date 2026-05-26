import { urlLooksLikeWebpAsset } from '@/lib/gallery/country-hub-cover';

/** WebP hub/cover previews are catalog browsing aids — no watermark overlay. */
export function shouldWatermarkFlagPreview(url: string | null | undefined): boolean {
  return !urlLooksLikeWebpAsset(url);
}
