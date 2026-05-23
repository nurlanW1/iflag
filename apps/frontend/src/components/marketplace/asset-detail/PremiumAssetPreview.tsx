'use client';

import Image from 'next/image';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  productTitle: string;
  previewUrls: string[];
  formatHints?: string[];
};

/** Clean hero viewer — white canvas, soft depth, gentle hover zoom */
export function PremiumAssetPreview({ productTitle, previewUrls, formatHints = [] }: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const src = uniq[0] ?? '';

  if (!src) {
    return (
      <div
        className="relative mx-auto aspect-[4/3] w-full max-w-[min(100%,64rem)] overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 shadow-inner lg:aspect-[16/10]"
        role="img"
        aria-label={`${productTitle} — no preview`}
      />
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div className="mx-auto w-full max-w-[min(100%,64rem)]">
      <div className="group/card overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.06)] transition-shadow duration-500 ease-out hover:shadow-[0_28px_64px_-32px_rgba(15,23,42,0.26),0_0_0_1px_rgba(15,23,42,0.07)]">
        <div className="relative aspect-[4/3] w-full lg:aspect-[16/10] lg:max-h-[min(65vh,640px)]">
          <Image
            src={src}
            alt={productTitle}
            fill
            unoptimized={svg}
            sizes="(max-width:1024px) 100vw, min(1040px, 70vw)"
            priority
            className="bg-slate-50/50 object-contain p-[clamp(1rem,3.5vw,2.75rem)] transition-[transform] duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/card:scale-[1.03]"
          />
        </div>
      </div>
    </div>
  );
}
