'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { Search, Flag } from 'lucide-react';
import type { GalleryPreviewItem } from '@/components/landing/LandingFlagGalleryPreview';
import { loadLandingFlagTeasers } from '@/lib/client/load-landing-flag-teasers';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

type EditorialHeroProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
};

/** Minimal editorial collage — abstract flag-inspired planes (fallback when no live assets). */
function HeroAbstractFallback() {
  return (
    <div className="relative mx-auto h-[200px] w-full max-w-md sm:h-[240px] lg:h-[280px]" aria-hidden>
      <div className="absolute inset-0 rounded-[1.35rem] bg-[#eef0f2]" />
      <div className="absolute inset-[10%] rounded-[1.1rem] border border-neutral-200/80 bg-[#fafaf9] shadow-[0_18px_44px_-22px_rgba(42,52,65,0.16)]" />
      <div
        className="absolute left-[8%] top-[14%] h-[26%] w-[40%] rounded-lg bg-[#b85c5c]/20 ring-1 ring-[#b85c5c]/15"
        style={{ transform: 'rotate(-8deg)' }}
      />
      <div
        className="absolute bottom-[16%] right-[10%] h-[24%] w-[46%] rounded-lg bg-[#5c7aa8]/18 ring-1 ring-[#5c7aa8]/12"
        style={{ transform: 'rotate(6deg)' }}
      />
      <div
        className="absolute right-[18%] top-[20%] h-[12%] w-[32%] rounded-md bg-[#c9a227]/18 ring-1 ring-[#c9a227]/14"
        style={{ transform: 'rotate(-4deg)' }}
      />
      <div className="absolute left-1/2 top-[42%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-neutral-200/90 bg-white shadow-sm lg:h-[4.25rem] lg:w-[4.25rem]">
        <Flag className="h-8 w-8 text-[var(--brand-blue)] lg:h-9 lg:w-9" strokeWidth={1.25} />
      </div>
    </div>
  );
}

/** Live thumbnails from Neon/R2 catalog (same API as “Explore Flag Assets”). */
function HeroRealtimeFlags() {
  const [items, setItems] = useState<GalleryPreviewItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadLandingFlagTeasers({ limit: 8 });
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) {
    return (
      <div
        className="mx-auto grid w-full max-w-lg grid-cols-2 gap-2 sm:max-w-xl sm:grid-cols-4 sm:gap-2.5 lg:max-w-md xl:max-w-lg"
        aria-busy="true"
        aria-label="Loading flag previews"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-neutral-200/75" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <HeroAbstractFallback />;
  }

  const slice = items.slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-lg sm:max-w-xl lg:max-w-md xl:max-w-lg">
      <p className="mb-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:mb-3 sm:text-left lg:text-right">
        Real catalog previews
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5" role="list">
        {slice.map((item, index) => {
          const svg = shouldUnoptimizeFlagImageHref(item.image_url, item.available_formats);
          const href =
            item.detailHref?.trim() || `/assets/${encodeURIComponent(item.slug)}`;
          return (
            <li key={item.id}>
              <Link
                href={href}
                className="group block overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-neutral-300 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    unoptimized={svg}
                    className="object-contain p-1.5 transition-transform duration-200 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 42vw, 160px"
                    loading={index < 4 ? 'eager' : 'lazy'}
                    priority={index < 4}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EditorialHero({
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
}: EditorialHeroProps) {
  const headingId = useId();

  return (
    <section className="border-b border-neutral-200/90 bg-[#fafaf9]" aria-labelledby={headingId}>
      <div className="marketplace-shell py-8 sm:py-10 lg:flex lg:items-center lg:py-11">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-12 xl:gap-16">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 sm:text-sm">
              Editorial marketplace
            </p>
            <h1
              id={headingId}
              className="mt-3 max-w-xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--brand-blue)] sm:text-[2.5rem] lg:text-[2.65rem]"
            >
              A calm marketplace for flags &amp; symbols
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-600">
              Country marks, vectors, and archives — predictable licensing.
            </p>

            <form onSubmit={onSubmitSearch} className="mt-6 max-w-xl lg:mt-7" role="search" aria-label="Search catalog">
              <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_10px_36px_-22px_rgba(42,52,65,0.18)] transition-shadow duration-300 focus-within:border-neutral-300 focus-within:shadow-[0_14px_40px_-20px_rgba(42,52,65,0.2)] sm:flex-row sm:items-stretch">
                <div className="flex min-h-12 flex-1 items-center gap-3 px-4 sm:px-5 lg:min-h-[3.25rem]">
                  <Search className="h-5 w-5 shrink-0 text-neutral-400 lg:h-6 lg:w-6" aria-hidden />
                  <label htmlFor="editorial-hero-search" className="sr-only">
                    Search
                  </label>
                  <input
                    id="editorial-hero-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="Search by country, format, or keyword…"
                    autoComplete="off"
                    className="min-w-0 flex-1 border-0 bg-transparent text-base text-[#2a2a2a] placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-12 shrink-0 bg-[var(--brand-blue)] px-7 text-base font-medium text-[#fafaf9] transition-colors duration-200 hover:bg-[var(--brand-blue-hover)] sm:min-h-[3.25rem] sm:rounded-none sm:rounded-r-xl sm:px-9"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <HeroRealtimeFlags />
        </div>
      </div>
    </section>
  );
}
