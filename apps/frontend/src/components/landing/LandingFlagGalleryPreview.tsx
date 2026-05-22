'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

/** Catalog tile from `/api/gallery/preview` (grouped Neon product teaser). */
export type GalleryPreviewItem = {
  id: string;
  title: string;
  country_slug: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  /** Resolved display URL — prefer thumbnails before originals. */
  image_url: string;
  /** Primary preview row format (browser-safe picks rank higher server-side). */
  format?: string | null;
  available_formats: string[];
  asset_group_key: string | null;
  slug: string;
  /** Used only by editorial hero fallback (country hubs). Catalog tiles omit this. */
  detailHref?: string | null;
};

const EXPLORE_GRID_LIMIT = 12;

export function LandingFlagGalleryPreview() {
  const [items, setItems] = useState<GalleryPreviewItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/gallery/preview?limit=${EXPLORE_GRID_LIMIT}&random=true`, {
          cache: 'no-store',
        });
        let rows: GalleryPreviewItem[] = [];
        if (res.ok) {
          const j = (await res.json()) as { data?: GalleryPreviewItem[] };
          rows = (j.data ?? []).slice(0, EXPLORE_GRID_LIMIT);
        }
        /** If insufficient grouped rows after DB filter (e.g. sample variance), refill with latest. */
        if (rows.length < EXPLORE_GRID_LIMIT) {
          const res2 = await fetch(
            `/api/gallery/preview?limit=${EXPLORE_GRID_LIMIT}&random=false`,
            { cache: 'no-store' },
          );
          if (res2.ok) {
            const j2 = (await res2.json()) as { data?: GalleryPreviewItem[] };
            const extra = j2.data ?? [];
            const seen = new Set(rows.map((r) => r.id));
            for (const r of extra) {
              if (rows.length >= EXPLORE_GRID_LIMIT) break;
              if (!seen.has(r.id)) {
                seen.add(r.id);
                rows.push(r);
              }
            }
          }
        }
        if (!cancelled) setItems(rows);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = items === null;
  const empty = !loading && items!.length === 0;

  return (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-14 md:py-20 lg:py-24">
      <div className="marketplace-shell">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-white via-[#fafaf9] to-neutral-100/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6 md:p-8 lg:rounded-[1.35rem]">
          {/* Banner stripe — matches regional rail; thumbnails use prior wide landscape (4×3-style) */}
          <div className="mb-8 rounded-xl bg-white/95 px-4 py-5 ring-1 ring-neutral-200/70 sm:mb-10 sm:px-6 sm:py-6">
            <SectionReveal
              hidden={{ opacity: 0, y: 10 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex max-w-3xl flex-col"
            >
              <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
                Explore Flag Assets
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
                Browse real flag designs available in JPG, PNG, SVG, EPS and more.
              </p>
            </SectionReveal>
          </div>

        {loading ? (
          <ul
            className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
            aria-busy="true"
            aria-label="Loading catalog previews"
          >
            {Array.from({ length: EXPLORE_GRID_LIMIT }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="aspect-[5/4] animate-pulse bg-neutral-200/90 sm:aspect-[4/3]" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-[88%] max-w-[12rem] animate-pulse rounded bg-neutral-200/90" />
                  <div className="h-3 w-[62%] max-w-[9rem] animate-pulse rounded bg-neutral-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : empty ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center text-neutral-600 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-base font-medium text-neutral-800">No flag assets available yet.</p>
          </div>
        ) : (
          <ul
            className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
            role="list"
          >
            {items!.map((item) => {
              const svg = shouldUnoptimizeFlagImageHref(item.image_url, [
                ...(item.available_formats ?? []),
                ...(item.format ? [item.format] : []),
              ]);
              const href = `/assets/${encodeURIComponent(item.slug)}`;

              const fmtSet = new Set(
                [...(item.available_formats ?? []).map((f) => f.toLowerCase())].filter(Boolean),
              );
              if (item.format?.trim()) fmtSet.delete(item.format.trim().toLowerCase());
              const otherFormats = [...fmtSet];
              const maxBadges = 3;

              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-300 hover:border-neutral-300 hover:shadow-md"
                  >
                    <div className="relative aspect-[5/4] bg-neutral-100 sm:aspect-[4/3]">
                      <Image
                        src={item.image_url}
                        alt={item.title || 'Flag asset'}
                        fill
                        loading="lazy"
                        unoptimized={svg}
                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 379px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="min-h-0">
                        <p className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-[#2a2a2a] md:text-base">
                          {item.title}
                        </p>
                        {item.country_slug ? (
                          <p className="mt-0.5 truncate text-[0.7rem] font-medium uppercase tracking-wide text-neutral-500">
                            {item.country_slug.replace(/-/g, ' ')}
                          </p>
                        ) : null}
                      </div>
                      {(item.format?.trim() || otherFormats.length > 0) && (
                        <ul className="mt-auto flex flex-wrap gap-1 pt-0.5" aria-label="Formats">
                          {item.format?.trim() ? (
                            <li className="rounded border border-neutral-200/95 bg-neutral-50 px-1.5 py-[1px] text-[0.6rem] font-bold uppercase tracking-wide text-neutral-600">
                              {item.format.trim().toUpperCase()}
                            </li>
                          ) : null}
                          {otherFormats.slice(0, maxBadges).map((fmt) => (
                            <li
                              key={fmt}
                              className="rounded border border-neutral-200/95 bg-neutral-50 px-1.5 py-[1px] text-[0.6rem] font-bold uppercase tracking-wide text-neutral-600"
                            >
                              {fmt.toUpperCase()}
                            </li>
                          ))}
                          {otherFormats.length > maxBadges ? (
                            <li className="px-0.5 text-[0.6rem] font-medium text-neutral-500">
                              +{otherFormats.length - maxBadges}
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !empty ? (
          <div className="mt-10 flex justify-center md:mt-12">
            <Link
              href="/gallery"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-blue)] px-10 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
            >
              Browse Gallery
            </Link>
          </div>
        ) : null}
        </div>
      </div>
    </section>
  );
}
