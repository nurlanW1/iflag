import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { FlagProtectedPreview } from '@/components/brand/FlagProtectedPreview';
import { PhotoWatermarkOverlay } from '@/components/brand/PhotoWatermark';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  variants: PublicProduct[];
  /** Optional “see all in gallery” link */
  galleryHref: string | null;
};

/**
 * Horizontal strip of same-country flag designs (all shown as premium stock), below main preview.
 */
export function CountryDesignVariantRibbon({ variants, galleryHref }: Props) {
  if (variants.length === 0) return null;

  return (
    <div className="min-w-0 rounded-2xl bg-white/70 p-5 ring-1 ring-slate-200/60 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">More from this country</h2>
          <p className="mt-1 text-[14px] font-medium text-slate-700">Other flag styles</p>
        </div>
        {galleryHref ? (
          <Link
            href={galleryHref}
            className="text-[13px] font-semibold text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            Gallery
          </Link>
        ) : null}
      </div>
      <div
        className="-mx-0.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 py-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
        role="list"
        aria-label="Other flag designs"
      >
        {variants.map((p) => {
          const href = p.detailHref?.trim() || `/flags/${p.slug}`;
          const thumb = p.thumbnailUrl ?? p.previewUrl;
          const formatHints = p.files.map((f) => f.format);
          const svgThumb = thumb ? shouldUnoptimizeFlagImageHref(thumb, formatHints) : false;

          return (
            <Link
              key={p.id}
              href={href}
              role="listitem"
              aria-label={`${p.title} — Premium stock`}
              title={p.title}
              className="group relative w-[6.25rem] shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md sm:w-28"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-50">
                {thumb ? (
                  <FlagProtectedPreview className="absolute inset-0">
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      unoptimized={svgThumb}
                      loading="lazy"
                      draggable={false}
                      sizes="118px"
                      className="relative z-0 object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                    <PhotoWatermarkOverlay />
                  </FlagProtectedPreview>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-neutral-400">
                    —
                  </div>
                )}
                <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-0.5 rounded-md bg-amber-400/95 px-[5px] py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-600/40">
                  <Crown size={9} aria-hidden strokeWidth={2.5} />
                  Premium
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
