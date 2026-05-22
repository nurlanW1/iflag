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
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200/70 bg-neutral-50 shadow-[0_22px_50px_-32px_rgba(15,23,42,0.28)]"
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
      <div className="group relative mx-auto overflow-hidden rounded-2xl border border-neutral-200/70 bg-neutral-50 shadow-[0_26px_60px_-36px_rgba(15,23,42,0.35)]">
        <div className="relative aspect-[4/3] w-full lg:aspect-[16/11]">
          <Image
            src={src}
            alt={`${productTitle} — preview`}
            fill
            unoptimized={svg}
            sizes="(max-width:1024px) 100vw, min(928px, 55vw)"
            priority
            loading="eager"
            className="object-contain p-6 transition-[transform] duration-500 ease-out will-change-transform sm:p-10 md:scale-100 md:group-hover:scale-[1.04]"
          />
        </div>
      </div>
      {uniq.length > 1 ? (
        <div className="-mx-1 mt-4 max-sm:overflow-x-auto max-sm:pb-2 sm:-mx-0">
          <ul
            className="flex min-h-0 snap-x gap-2 px-1 sm:grid sm:grid-cols-4 sm:gap-2 sm:px-0 sm:mx-auto sm:max-w-md md:justify-center lg:justify-start lg:gap-3"
            role="tablist"
            aria-label="Preview variants"
          >
            {uniq.map((u, i) => {
              const on = i === activeIdx;
              const thumb = shouldUnoptimizeFlagImageHref(u, formatHints);
              return (
                <li key={u} className="min-w-[4.75rem] flex-none snap-start sm:min-w-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setActiveIdx(i)}
                    className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-white shadow-sm transition-[border-color,box-shadow,opacity,transform] duration-200 sm:aspect-[4/3] ${
                      on
                        ? 'border-neutral-900 ring-2 ring-neutral-900/15'
                        : 'border-neutral-100 opacity-85 hover:border-neutral-200 hover:opacity-100 hover:shadow-md'
                    }`}
                  >
                    <Image
                      src={u}
                      alt=""
                      fill
                      unoptimized={thumb}
                      loading="lazy"
                      sizes="(max-width:640px) 76px, 112px"
                      className="object-contain p-1"
                    />
                    <span className="sr-only">Preview thumbnail {i + 1}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
