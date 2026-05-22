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
    <div className="mt-6 min-w-0 lg:mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Other designs</h2>
          <p className="mt-0.5 text-[13px] text-neutral-600">Same country · more styles</p>
        </div>
        {galleryHref ? (
          <Link
            href={galleryHref}
            className="shrink-0 text-[13px] font-semibold text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            View gallery
          </Link>
        ) : null}
      </div>
      <div
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 pl-1 pr-1 pt-0.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] md:gap-3.5"
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
              className="group relative w-[5.75rem] shrink-0 snap-start overflow-hidden rounded-lg border border-neutral-200/90 bg-white shadow-sm ring-1 ring-black/[0.03] transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md sm:w-[6.75rem]"
            >
              <div className="relative aspect-[4/3] w-full bg-[#eaecef]">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    unoptimized={svgThumb}
                    loading="lazy"
                    sizes="110px"
                    className="object-contain p-1.5 transition-opacity group-hover:opacity-95"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-200/35 text-[10px] font-medium text-neutral-500">
                    —
                  </div>
                )}
                <span
                  className={`pointer-events-none absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    paid ? 'bg-[var(--brand-blue)]/93 text-[#fafaf9]' : 'border border-white/75 bg-white/90 text-neutral-800'
                  }`}
                >
                  {paid ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Crown size={10} aria-hidden strokeWidth={2} />
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
