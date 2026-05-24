'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  productTitle: string;
  previewUrls: string[];
  /** Used for svg URL handling */
  formatHints?: string[];
  /** Chessboard matte behind previews that may carry alpha (PNG/WebP/SVG/etc.) */
  useTransparencyBackdrop?: boolean;
  /** Gallery-style card with generous padding (stock PDP default). */
  variant?: 'gallery' | 'compact';
  /** Tighter preview cap for marketplace PDP (fits above-the-fold with sidebar). */
  density?: 'default' | 'compact';
  /** Footer line under preview (gallery country pages). */
  caption?: string;
  formatCount?: number;
};

const checkerBg =
  'bg-[#eceef2] [background-image:linear-gradient(45deg,#dadde3_25%,transparent_25%),linear-gradient(-45deg,#dadde3_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#dadde3_75%),linear-gradient(-45deg,transparent_75%,#dadde3_75%)] [background-size:11px_11px] [background-position:0_0,0_5.5px,5.5px_-5.5px,-5.5px_0]';

/** Stock preview — gallery layout by default for breathing room around the flag art. */
export function PremiumAssetPreview({
  productTitle,
  previewUrls,
  formatHints = [],
  useTransparencyBackdrop = false,
  variant = 'gallery',
  density = 'default',
  caption,
  formatCount,
}: Props) {
  const uniq = [...new Set(previewUrls.filter((u) => typeof u === 'string' && u.trim()))];
  const src = uniq[0] ?? '';
  const compact = density === 'compact';
  const showFooter =
    !compact && Boolean(caption?.trim() || (formatCount != null && formatCount > 0));

  if (variant === 'gallery') {
    const frame = compact
      ? clsx(
          'relative flex min-h-[11rem] items-center justify-center px-3 py-4 sm:min-h-[13rem] sm:px-4 sm:py-5',
          'lg:max-h-[min(40vh,15.5rem)] lg:min-h-0',
          useTransparencyBackdrop ? checkerBg : 'bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)]',
        )
      : clsx(
          'relative flex min-h-[24rem] items-center justify-center px-5 py-10 sm:min-h-[30rem] sm:px-10 sm:py-12 lg:min-h-[min(62vh,36rem)] xl:min-h-[min(65vh,40rem)]',
          useTransparencyBackdrop ? checkerBg : 'bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)]',
        );

    const imgClamp = compact
      ? 'max-h-[min(40vh,15rem)] w-auto max-w-full object-contain lg:max-h-[min(38vh,14rem)]'
      : 'max-h-[min(62vh,40rem)] w-auto max-w-full object-contain';

    return (
      <div
        className={clsx(
          'overflow-hidden border border-slate-200/80 bg-white',
          compact ? 'rounded-xl' : 'rounded-[1.375rem]',
        )}
      >
        <div className={frame}>
          {src ? (
            <ProductPreviewImage
              className={clsx(
                'relative mx-auto inline-flex max-w-full items-center justify-center',
                compact ? 'max-h-[min(40vh,15rem)] lg:max-h-[min(38vh,14rem)]' : 'max-h-[min(62vh,40rem)]',
              )}
              watermarkEnabled
              protectEnabled
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN previews */}
              <img
                src={src}
                alt={productTitle}
                className={imgClamp}
                referrerPolicy="no-referrer"
                decoding="async"
                draggable={false}
              />
            </ProductPreviewImage>
          ) : (
            <div
              className="flex h-48 w-full max-w-md items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400"
              role="img"
              aria-label={`${productTitle} — no preview`}
            >
              No preview
            </div>
          )}
          {useTransparencyBackdrop && src ? (
            <span
              className={clsx(
                'pointer-events-none absolute z-10 rounded-lg bg-white/92 font-bold uppercase tracking-[0.14em] text-slate-500 ring-1 ring-slate-200/80 backdrop-blur-sm',
                compact
                  ? 'bottom-2 right-2 px-2 py-0.5 text-[9px]'
                  : 'bottom-4 right-4 px-2.5 py-1 text-[10px]',
              )}
            >
              Alpha preview
            </span>
          ) : null}
        </div>
        {showFooter ? (
          <div className="flex flex-col gap-1 border-t border-slate-100 px-5 py-3 text-center sm:px-6">
            {caption?.trim() ? (
              <p className="truncate text-sm font-medium text-slate-700" title={caption}>
                {caption}
              </p>
            ) : null}
            {formatCount != null && formatCount > 0 ? (
              <p className="text-xs text-slate-500">
                {formatCount} format{formatCount === 1 ? '' : 's'} available
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={clsx(
          'relative mx-auto aspect-[4/3] w-full max-w-[min(100%,66rem)] overflow-hidden rounded-[1.375rem]',
          useTransparencyBackdrop ? checkerBg : 'bg-gradient-to-b from-white to-slate-50',
          'ring-1 ring-slate-200/70 lg:aspect-[16/10]',
        )}
        role="img"
        aria-label={`${productTitle} — no preview`}
      />
    );
  }

  const svg = shouldUnoptimizeFlagImageHref(src, formatHints);

  return (
    <div className="mx-auto w-full max-w-[min(100%,66rem)]">
      <div className="overflow-hidden rounded-[1.375rem] border border-slate-200/80 bg-white">
        <div
          className={clsx(
            'relative aspect-[4/3] w-full lg:aspect-[16/10] lg:max-h-[min(66vh,680px)]',
            useTransparencyBackdrop ? checkerBg : 'bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)]',
          )}
        >
          <ProductPreviewImage className="absolute inset-0" watermarkEnabled protectEnabled>
            <Image
              src={src}
              alt={productTitle}
              fill
              unoptimized={svg}
              draggable={false}
              sizes="(max-width:1024px) 100vw, min(1060px, 72vw)"
              priority
              className="relative z-0 object-contain p-[clamp(1.25rem,4vw,3rem)]"
            />
          </ProductPreviewImage>
        </div>
      </div>
    </div>
  );
}
