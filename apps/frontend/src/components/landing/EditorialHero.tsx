'use client';

import Link from 'next/link';
import { useId } from 'react';
import { Search } from 'lucide-react';
import { HERO_TABS, buildHeroDestination } from '@/lib/landing/hero-categories';

type EditorialHeroProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
};

export function EditorialHero({
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
}: EditorialHeroProps) {
  const headingId = useId();
  const searchInputId = 'editorial-hero-search';

  return (
    <section
      className="relative min-h-[15rem] overflow-hidden border-b border-neutral-200/90 md:min-h-[18rem] lg:min-h-[clamp(24rem,32vw,44rem)]"
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[-2.5rem] z-0 min-h-[12rem] bg-cover bg-[center_28%] bg-no-repeat md:top-[-1.75rem] md:min-h-0 lg:top-[-1.75rem] lg:h-[calc(100%+1.75rem)] lg:bg-[length:100%_auto] lg:bg-top lg:bg-center"
        style={{ backgroundImage: 'url(/images/mypexel1.webp)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#fafaf9]/88 via-[#fafaf9]/55 to-[#fafaf9]/92 md:bg-gradient-to-r md:from-[#fafaf9]/78 md:via-[#fafaf9]/32 md:to-transparent md:to-[82%]"
        aria-hidden
      />

      <div className="marketplace-shell relative z-10 pb-9 pt-8 sm:pb-11 sm:pt-10 lg:pb-14 lg:pt-12">
        <div className="max-w-xl md:max-w-xl lg:max-w-xl lg:pt-2">
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 shadow-sm backdrop-blur-sm">
                Editorial marketplace
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800 ring-1 ring-emerald-400/40">
                200+ countries · Free flags
              </span>
            </div>
            <h1
              id={headingId}
              className="mt-3 max-w-xl text-balance text-2xl font-semibold leading-[1.14] tracking-tight text-[var(--brand-blue)] drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)] sm:mt-4 sm:text-[1.875rem] sm:leading-[1.12] md:text-[2.125rem] lg:text-[2.625rem] lg:leading-[1.1]"
            >
              Professional flag assets for every project
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-700 [text-shadow:0_1px_0_rgba(255,255,255,0.45)] sm:mt-4 sm:text-base lg:text-[1.0625rem]">
              Official country flags, vector designs and archives — SVG, PNG, WebP formats with predictable commercial licensing.
            </p>

            <div
              role="toolbar"
              aria-label="Popular catalog categories"
              className="-mx-1 mt-5 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 pt-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden md:gap-2.5 lg:mt-7"
            >
              {HERO_TABS.map((t) => (
                <Link
                  key={t.id}
                  href={buildHeroDestination(t.id, searchQuery)}
                  className="inline-flex min-h-[2.75rem] shrink-0 snap-start items-center justify-center rounded-full border border-neutral-400/65 bg-[#fafaf9]/94 px-[0.9375rem] py-2 text-[0.8125rem] font-semibold tracking-tight text-neutral-900 shadow-[0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-white/18 backdrop-blur-[2px] transition-[border-color,background-color,color,box-shadow] hover:border-neutral-500 hover:bg-[#fafaf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 sm:min-h-0 sm:text-sm"
                >
                  {t.label}
                </Link>
              ))}
            </div>

            <form onSubmit={onSubmitSearch} className="mt-4 lg:mt-7" role="search" aria-label="Search catalog">
              <div className="flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-[0_8px_32px_-12px_rgba(15,23,42,0.14)] transition-[border-color,box-shadow] duration-300 focus-within:border-neutral-300 focus-within:shadow-md sm:flex-row sm:items-stretch">
                <div className="flex min-h-[3rem] flex-1 items-center gap-3 bg-white px-3.5 sm:min-h-[3.125rem] sm:px-4 lg:min-h-[3.25rem]">
                  <Search className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
                  <label htmlFor={searchInputId} className="sr-only">
                    Search
                  </label>
                  <input
                    id={searchInputId}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="Country, format, or keyword…"
                    autoComplete="off"
                    className="min-w-0 flex-1 border-0 bg-white text-base text-[#2a2a2a] placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[3rem] w-full shrink-0 bg-[var(--brand-blue)] px-6 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-[var(--brand-blue-hover)] sm:w-auto sm:min-h-[3.125rem] sm:rounded-none sm:rounded-br-xl sm:rounded-tr-xl sm:px-8 lg:min-h-[3.25rem]"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
