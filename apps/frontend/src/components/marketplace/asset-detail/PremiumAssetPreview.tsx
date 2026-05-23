'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  productTitle: string;
  previewUrls: string[];
  /** Used for svg URL handling */
  formatHints?: string[];
  /** Chessboard matte behind previews that may carry alpha (PNG/WebP/SVG/etc.) */
  useTransparencyBackdrop?: boolean;
};

const checkerBg =
  'bg-[#eceef2] [background-image:linear-gradient(45deg,#dadde3_25%,transparent_25%),linear-gradient(-45deg,#dadde3_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#dadde3_75%),linear-gradient(-45deg,transparent_75%,#dadde3_75%)] [background-size:11px_11px] [background-position:0_0,0_5.5px,5.5px_-5.5px,-5.5px_0]';

/** Premium floating preview card with optional checkerboard for transparent assets */
export function PremiumAssetPreview({
  productTitle,
  previewUrls,
  formatHints = [],
  useTransparencyBackdrop = false,
}: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const src = uniq[0] ?? '';

  if (!src) {
    return (
      <div
        className={clsx(
          'relative mx-auto aspect-[4/3] w-full max-w-[min(100%,66rem)] overflow-hidden rounded-[1.375rem]',
          useTransparencyBackdrop ? checkerBg : 'bg-gradient-to-b from-white to-slate-50',
          'ring-1 ring-slate-200/65 shadow-inner lg:aspect-[16/10]',
        )}
        role="img"
        aria-label={`${productTitle} — no preview`}
      />
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div className="mx-auto w-full max-w-[min(100%,66rem)]">
      <div className="-translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-1 hover:opacity-[0.997] lg:hover:-translate-y-1">
        <div
          className={clsx(
            'overflow-hidden rounded-[1.375rem]',
            'bg-white/90 shadow-[0_28px_64px_-40px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70',
            'backdrop-blur-[2px]',
            'transition-[box-shadow,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'hover:shadow-[0_40px_80px_-44px_rgba(15,23,42,0.38)] hover:ring-slate-300/80',
          )}
        >
          <div
            className={clsx(
              'relative aspect-[4/3] w-full lg:aspect-[16/10] lg:max-h-[min(66vh,680px)]',
              useTransparencyBackdrop ? checkerBg : 'bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)]',
            )}
          >
            <Image
              src={src}
              alt={productTitle}
              fill
              unoptimized={svg}
              sizes="(max-width:1024px) 100vw, min(1060px, 72vw)"
              priority
              className={clsx(
                'object-contain p-[clamp(1rem,3.75vw,2.85rem)]',
                'transition-[transform] duration-[680ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:scale-[1.035]',
              )}
            />
            {useTransparencyBackdrop ? (
              <span className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm">
                Alpha preview
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
