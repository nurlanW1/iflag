'use client';

import Image from 'next/image';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  productTitle: string;
  /** Prefer preview then thumbnail HTTPS URLs — never heavyweight masters */
  previewUrls: string[];
  /** Formats for svg detection on images */
  formatHints?: string[];
};

/** Single large preview — primary URL only (stock-style hero). */
export function PremiumAssetPreview({ productTitle, previewUrls, formatHints = [] }: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const src = uniq[0] ?? '';

  if (!src) {
    return (
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 lg:aspect-[16/11]"
        role="img"
        aria-label={`${productTitle} — no preview`}
      />
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div className="mx-auto w-full max-w-[56rem]">
      <div className="relative overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-200/80">
        <div className="relative aspect-[4/3] w-full lg:aspect-[16/11]">
          <Image
            src={src}
            alt={productTitle}
            fill
            unoptimized={svg}
            sizes="(max-width:1024px) 100vw, min(896px, 58vw)"
            priority
            className="object-contain p-5 sm:p-8"
          />
        </div>
      </div>
    </div>
  );
}
