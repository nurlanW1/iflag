'use client';

import Image from 'next/image';
import { useState } from 'react';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  productTitle: string;
  /** Unique preview HTTPS URLs — prefer PNG/WebP thumbnails, never heavyweight masters */
  previewUrls: string[];
  /** Formats only for svg detection on images */
  formatHints?: string[];
};

export function PremiumAssetPreview({ productTitle, previewUrls, formatHints = [] }: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const [activeIdx, setActiveIdx] = useState(0);
  const src = uniq[Math.min(activeIdx, Math.max(0, uniq.length - 1))] ?? '';

  if (!src) {
    return (
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.65rem] border border-neutral-200/90 bg-[linear-gradient(145deg,#f4f6f8_0%,#fafaf9_48%,#e8eef2_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_24px_64px_-40px_rgba(15,23,42,0.38)] ring-1 ring-black/[0.04]"
        role="img"
        aria-label="No preview"
      >
        <p className="text-sm font-medium text-neutral-500">Preview unavailable</p>
      </div>
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div className="mx-auto max-w-[52rem]">
      <div
        className="group relative mx-auto overflow-hidden rounded-[1.65rem] border border-neutral-200/90 bg-[linear-gradient(145deg,#f4f6f8_0%,#fafaf9_52%,#e8eef2_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_28px_70px_-38px_rgba(15,23,42,0.42)] ring-1 ring-black/[0.04]"
      >
        <div className="relative aspect-[4/3] w-full lg:aspect-[16/11]">
          <Image
            src={src}
            alt={`${productTitle} — preview`}
            fill
            unoptimized={svg}
            sizes="(max-width:1024px) 100vw, min(928px, 55vw)"
            priority
            loading="eager"
            className="object-contain p-6 transition-[transform] duration-500 ease-out will-change-transform sm:p-10 md:scale-100 md:group-hover:scale-[1.045]"
          />
        </div>
      </div>
      {uniq.length > 1 ? (
        <ul
          className="mt-4 grid grid-cols-4 gap-2 sm:mx-auto sm:max-w-md sm:grid-cols-4 md:justify-center lg:justify-start lg:gap-3"
          role="tablist"
          aria-label="Preview variants"
        >
          {uniq.map((u, i) => {
            const on = i === activeIdx;
            const sm = shouldUnoptimizeFlagImageHref(u, formatHints);
            return (
              <li key={u}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveIdx(i)}
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-[border-color,box-shadow,opacity] duration-200 ${
                    on
                      ? 'border-[var(--brand-blue)] ring-2 ring-[var(--brand-blue)]/20'
                      : 'border-transparent opacity-70 hover:border-neutral-200 hover:opacity-100'
                  }`}
                >
                  <Image src={u} alt="" fill unoptimized={sm} sizes="112px" className="object-contain p-1" />
                  <span className="sr-only">Preview thumbnail {i + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
