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

/** Wide preview on neutral stage (similar to marketplace reference pages). */
export function PremiumAssetPreview({ productTitle, previewUrls, formatHints = [] }: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const src = uniq[0] ?? '';

  if (!src) {
    return (
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#dfe1e6] lg:aspect-[16/11]"
        role="img"
        aria-label={`${productTitle} — no preview`}
      />
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div className="mx-auto w-full max-w-[58rem]">
      <div className="overflow-hidden rounded-lg border border-neutral-400/14 bg-[#dfe1e6] shadow-inner ring-1 ring-black/[0.04]">
        <div className="relative aspect-[4/3] w-full lg:aspect-[16/11] lg:min-h-[min(520px,50vh)]">
          <Image
            src={src}
            alt={productTitle}
            fill
            unoptimized={svg}
            sizes="(max-width:1024px) 100vw, min(928px, 62vw)"
            priority
            className="object-contain p-6 sm:p-10 md:p-12"
          />
        </div>
      </div>
    </div>
  );
}
