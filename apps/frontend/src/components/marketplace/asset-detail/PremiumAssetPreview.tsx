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

/** Premium hero viewer — showroom card with hover drift zoom. */
export function PremiumAssetPreview({ productTitle, previewUrls, formatHints = [] }: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const src = uniq[0] ?? '';

  if (!src) {
    return (
      <div
        className="relative mx-auto aspect-[4/3] max-h-[min(70vh,640px)] w-full max-w-[min(100%,68rem)] overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-neutral-100 to-neutral-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-neutral-300/35 lg:aspect-[16/11]"
        role="img"
        aria-label={`${productTitle} — no preview`}
      />
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div className="group/card mx-auto w-full max-w-[min(100%,68rem)]">
      <div
        className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-white via-neutral-50/90 to-neutral-100/95 shadow-[0_26px_64px_-30px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-neutral-200/65 transition-[box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[box-shadow] hover:shadow-[0_38px_80px_-36px_rgba(15,23,42,0.42)]"
      >
        <div className="relative aspect-[4/3] w-full max-h-[min(70vh,700px)] min-h-[min(52vw,420px)] sm:min-h-[320px] lg:aspect-[16/11] lg:max-h-[min(72vh,720px)]">
          <Image
            src={src}
            alt={productTitle}
            fill
            unoptimized={svg}
            sizes="(max-width:1024px) 100vw, min(1104px, 72vw)"
            priority
            className="object-contain p-[clamp(1.25rem,4vw,3.25rem)] transition-[transform] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover/card:scale-[1.04]"
          />
        </div>
      </div>
    </div>
  );
}
