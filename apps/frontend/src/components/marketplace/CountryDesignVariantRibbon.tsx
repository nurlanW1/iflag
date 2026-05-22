import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import { isPaidCatalogProduct } from '@/lib/marketplace/catalog-utils';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  variants: PublicProduct[];
  /** Optional “see all in gallery” link */
  galleryHref: string | null;
};

/**
 * Horizontal strip of same-country flag designs (thumbnails + Free/Pro), below main preview.
 */
export function CountryDesignVariantRibbon({ variants, galleryHref }: Props) {
  if (variants.length === 0) return null;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-300/40 pb-3">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">More from this country</h2>
          <p className="mt-0.5 text-[13px] font-medium text-neutral-600">Other flag styles</p>
        </div>
        {galleryHref ? (
          <Link
            href={galleryHref}
            className="shrink-0 text-[13px] font-semibold text-neutral-800 underline-offset-4 transition-colors hover:text-[var(--brand-blue)] hover:underline"
          >
            View gallery →
          </Link>
        ) : null}
      </div>
      <div
        className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 py-2 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:gap-3"
        role="list"
        aria-label="Other flag designs"
      >
        {variants.map((p) => {
          const paid = isPaidCatalogProduct(p);
          const href = p.detailHref?.trim() || `/flags/${p.slug}`;
          const thumb = p.thumbnailUrl ?? p.previewUrl;
          const formatHints = p.files.map((f) => f.format);
          const svgThumb = thumb ? shouldUnoptimizeFlagImageHref(thumb, formatHints) : false;

          return (
            <Link
              key={p.id}
              href={href}
              role="listitem"
              aria-label={`${p.title} — ${paid ? 'Premium' : 'Free'}`}
              title={p.title}
              className="group relative w-24 shrink-0 snap-start overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)] ring-1 ring-black/[0.03] transition-[box-shadow,transform,border-color] duration-300 hover:z-[1] hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.3)] sm:w-[6.85rem]"
            >
              <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-neutral-100 to-neutral-200/85">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    unoptimized={svgThumb}
                    loading="lazy"
                    sizes="118px"
                    className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-neutral-400">
                    —
                  </div>
                )}
                <span
                  className={`pointer-events-none absolute left-1.5 top-1.5 rounded-md px-[5px] py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    paid ? 'bg-[var(--brand-blue)]/94 text-[#fafaf9]' : 'border border-white/80 bg-white/92 text-neutral-800'
                  }`}
                >
                  {paid ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Crown size={9} aria-hidden strokeWidth={2.5} />
                      Pro
                    </span>
                  ) : (
                    'Free'
                  )}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
