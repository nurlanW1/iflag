'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { FlagProtectedPreview } from '@/components/brand/FlagProtectedPreview';
import { PhotoWatermarkOverlay } from '@/components/brand/PhotoWatermark';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  productTitle: string;
  previewUrls: string[];
  /** Used for svg URL handling */
  formatHints?: string[];
  /** Chessboard matte behind previews that may carry alpha (PNG/WebP/SVG/etc.) */
  useTransparencyBackdrop?: boolean;
  /** Desktop hero: stretch vertically to match sibling commerce panel */
  fillColumn?: boolean;
};

const checkerBg =
  'bg-[#eceef2] [background-image:linear-gradient(45deg,#dadde3_25%,transparent_25%),linear-gradient(-45deg,#dadde3_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#dadde3_75%),linear-gradient(-45deg,transparent_75%,#dadde3_75%)] [background-size:11px_11px] [background-position:0_0,0_5.5px,5.5px_-5.5px,-5.5px_0]';

/** Premium floating preview card with optional checkerboard for transparent assets */
export function PremiumAssetPreview({
  productTitle,
  previewUrls,
  formatHints = [],
  useTransparencyBackdrop = false,
  fillColumn = false,
}: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const src = uniq[0] ?? '';

  if (!src) {
    return (
      <div
        className={clsx(
          'relative mx-auto aspect-[4/3] w-full max-w-[min(100%,66rem)] overflow-hidden rounded-[1.375rem]',
          useTransparencyBackdrop ? checkerBg : 'bg-gradient-to-b from-white to-slate-50',
          'ring-1 ring-slate-200/70',
          !fillColumn && 'lg:aspect-[16/10]',
          fillColumn && 'lg:flex-1 lg:aspect-auto lg:min-h-[14rem]',
        )}
        role="img"
        aria-label={`${productTitle} — no preview`}
      />
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div
      className={clsx(
        'mx-auto w-full max-w-[min(100%,66rem)]',
        fillColumn && 'lg:mx-0 lg:max-w-none lg:flex lg:min-h-0 lg:flex-1 lg:flex-col',
      )}
    >
      <div
        className={clsx(
          '-translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-1 hover:opacity-[0.997] lg:hover:-translate-y-1',
          fillColumn && 'lg:flex lg:min-h-0 lg:flex-1 lg:flex-col',
        )}
      >
        <div
          className={clsx(
            'overflow-hidden rounded-[1.375rem]',
            'border border-slate-200/80 bg-white',
            'transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'hover:border-slate-300/90',
            fillColumn && 'lg:flex lg:min-h-0 lg:flex-1 lg:flex-col',
          )}
        >
          <div
            className={clsx(
              'relative aspect-[4/3] w-full',
              !fillColumn && 'lg:aspect-[16/10] lg:max-h-[min(66vh,680px)]',
              fillColumn && 'lg:flex lg:min-h-0 lg:flex-1 lg:aspect-auto',
              useTransparencyBackdrop ? checkerBg : 'bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)]',
            )}
          >
            <FlagProtectedPreview className="absolute inset-0">
              <Image
                src={src}
                alt={productTitle}
                fill
                unoptimized={svg}
                draggable={false}
                sizes="(max-width:1024px) 100vw, min(1060px, 72vw)"
                priority
                className={clsx(
                  'relative z-0 object-contain p-[clamp(1rem,3.75vw,2.85rem)]',
                  'transition-[transform] duration-[680ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                  'hover:scale-[1.035]',
                )}
              />
              <PhotoWatermarkOverlay />
              {useTransparencyBackdrop ? (
                <span className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-lg bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 ring-1 ring-slate-200/80 backdrop-blur-sm">
                  Alpha preview
                </span>
              ) : null}
            </FlagProtectedPreview>
          </div>
        </div>
      </div>
    </div>
  );
}
