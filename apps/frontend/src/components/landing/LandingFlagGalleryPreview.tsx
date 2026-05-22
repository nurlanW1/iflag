'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';
import { loadLandingFlagTeasers } from '@/lib/client/load-landing-flag-teasers';

export type GalleryPreviewItem = {
  id: string;
  title: string;
  country_slug: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  image_url: string;
  available_formats: string[];
  asset_group_key: string | null;
  slug: string;
  /** Default link is `/assets/${slug}`; set for country-hub fallbacks (`/gallery/...`). */
  detailHref?: string | null;
};

const LANDING_GALLERY_COUNT = 6;

export function LandingFlagGalleryPreview() {
  const [items, setItems] = useState<GalleryPreviewItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadLandingFlagTeasers({ limit: LANDING_GALLERY_COUNT });
        if (!cancelled) {
          setFailed(data.length === 0);
          setItems(data);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
          setItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = items === null;
  const empty = !loading && (items!.length === 0 || failed);

  return (
    <section className="border-t border-neutral-200/80 bg-[#fafaf9] py-16 md:py-24 lg:py-28">
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 10 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex max-w-3xl flex-col sm:mb-12"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
            From the gallery
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
            A quick look at published designs — open the full gallery for every country hub, format, and folder.
          </p>
        </SectionReveal>

        {loading ? (
          <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: LANDING_GALLERY_COUNT }).map((_, i) => (
              <li
                key={i}
                className="overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-sm"
              >
                <div className="aspect-[5/4] animate-pulse bg-neutral-200/90 sm:aspect-[4/3]" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : empty ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-medium text-neutral-800">Gallery preview unavailable</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
              Published flag assets will appear here automatically once they are synced to the catalog.
            </p>
            <Link
              href="/gallery"
              className="mt-8 inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-[var(--brand-blue)] px-8 text-sm font-semibold text-white transition hover:bg-[var(--brand-blue-hover)]"
            >
              Show more
              <ChevronRight size={18} aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-3">
            {items!.map((item) => {
              const svg = shouldUnoptimizeFlagImageHref(item.image_url, item.available_formats);
              const href =
                item.detailHref?.trim() || `/assets/${encodeURIComponent(item.slug)}`;
              return (
              <li key={item.id}>
                <Link
                  href={href}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-neutral-300 hover:shadow-md"
                >
                  <div className="relative aspect-[5/4] bg-neutral-100 sm:aspect-[4/3]">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      unoptimized={svg}
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 439px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 text-left text-[0.95rem] font-semibold leading-snug text-[#2a2a2a] md:text-base">
                      {item.title}
                    </h3>
                    {item.country_slug ? (
                      <p className="text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                        {item.country_slug.replace(/-/g, ' ')}
                      </p>
                    ) : null}
                    {item.available_formats.length > 0 ? (
                      <ul className="mt-auto flex flex-wrap gap-1.5 pt-1" aria-label="Formats">
                        {item.available_formats.slice(0, 5).map((fmt) => (
                          <li
                            key={fmt}
                            className="rounded border border-neutral-200/90 bg-neutral-50 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-600"
                          >
                            {fmt}
                          </li>
                        ))}
                        {item.available_formats.length > 5 ? (
                          <li className="px-1 text-[0.65rem] font-medium text-neutral-500">
                            +{item.available_formats.length - 5}
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                </Link>
              </li>
              );
            })}
          </ul>
        )}

        {!loading && !empty ? (
          <div className="mt-10 flex justify-center sm:mt-12">
            <Link
              href="/gallery"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-10 text-base font-semibold text-[#2a2a2a] shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              Show more
              <ChevronRight size={20} aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
