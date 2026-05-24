import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type Props = {
  variants: PublicProduct[];
  /** Optional “see all in gallery” link */
  galleryHref: string | null;
};

/**
 * Same-country designs — spacing matches gallery country variant picker.
 */
export function CountryDesignVariantRibbon({ variants, galleryHref }: Props) {
  if (variants.length === 0) return null;

  return (
    <section className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Other designs</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">Choose another shape or style</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {variants.length}
          </span>
          {galleryHref ? (
            <Link
              href={galleryHref}
              className="text-xs font-semibold text-[var(--brand-blue)] underline-offset-4 hover:underline"
            >
              Gallery
            </Link>
          ) : null}
        </div>
      </div>
      <div
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:-mx-5 sm:gap-4 sm:px-5"
        role="list"
        aria-label="Other flag designs"
      >
        {variants.map((p) => {
          const href = p.detailHref?.trim() || `/flags/${p.slug}`;
          const thumb = p.thumbnailUrl ?? p.previewUrl;
          const formatHints = p.files.map((f) => f.format);
          const svgThumb = thumb ? shouldUnoptimizeFlagImageHref(thumb, formatHints) : false;
          const formatCount = p.files.length;

          return (
            <Link
              key={p.id}
              href={href}
              role="listitem"
              aria-label={`${p.title} — Premium stock`}
              title={p.title}
              className="group w-[7.5rem] shrink-0 text-left sm:w-32"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 transition-all group-hover:ring-slate-300">
                {thumb ? (
                  <ProductPreviewImage className="absolute inset-0" watermarkEnabled protectEnabled>
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      unoptimized={svgThumb}
                      loading="lazy"
                      draggable={false}
                      sizes="128px"
                      className="relative z-0 object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03] sm:p-2.5"
                    />
                  </ProductPreviewImage>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-neutral-400">
                    —
                  </div>
                )}
                <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-0.5 rounded-md bg-amber-400/95 px-[5px] py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-600/40">
                  <Crown size={9} aria-hidden strokeWidth={2.5} />
                  Premium
                </span>
                {formatCount > 0 ? (
                  <span className="pointer-events-none absolute right-1.5 top-1.5 z-10 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {formatCount}
                  </span>
                ) : null}
              </div>
              <p
                className="mt-2 line-clamp-2 px-0.5 text-[11px] font-medium leading-tight text-slate-600 group-hover:text-slate-900"
                title={p.title}
              >
                {p.title}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
