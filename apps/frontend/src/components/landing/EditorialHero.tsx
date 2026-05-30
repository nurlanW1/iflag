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
      className="relative min-h-[16rem] overflow-hidden border-b border-neutral-200/90 md:min-h-[20rem] lg:min-h-[clamp(26rem,34vw,46rem)]"
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[-2.5rem] z-0 min-h-[12rem] bg-cover bg-[center_32%] bg-no-repeat md:top-[-1.75rem] md:min-h-0 lg:top-[-1.75rem] lg:h-[calc(100%+1.75rem)] lg:bg-[length:100%_auto] lg:bg-top"
        style={{ backgroundImage: 'url(/images/mypexel1.webp)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#fafaf9]/92 via-[#fafaf9]/62 to-[#fafaf9]/88 lg:bg-gradient-to-r lg:from-[#fafaf9]/88 lg:via-[#fafaf9]/48 lg:to-transparent lg:to-[78%]"
        aria-hidden
      />

      <div className="marketplace-shell relative z-10 flex flex-col justify-end pb-8 pt-9 sm:pb-10 sm:pt-11 lg:min-h-[clamp(26rem,34vw,46rem)] lg:pb-14 lg:pt-14">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end lg:gap-10 xl:gap-14">
          {/* Copy */}
          <div className="max-w-xl lg:max-w-none lg:pb-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-[0.8125rem]">
              Editorial marketplace
            </p>
            <h1
              id={headingId}
              className="mt-2.5 max-w-xl text-balance text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-[var(--brand-blue)] sm:mt-3 sm:text-[2rem] lg:text-[2.625rem] lg:leading-[1.08]"
            >
              A calm marketplace for flags &amp; symbols
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-600 sm:mt-4 sm:text-base lg:max-w-md">
              Country marks, vectors, and archives — predictable licensing.
            </p>
          </div>

          {/* Search + categories — solid white panel */}
          <div className="w-full max-w-xl lg:max-w-none lg:justify-self-end">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.18)] sm:p-5 lg:p-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Browse catalog
              </p>

              <div
                role="toolbar"
                aria-label="Popular catalog categories"
                className="-mx-0.5 mb-4 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
              >
                {HERO_TABS.map((t) => (
                  <Link
                    key={t.id}
                    href={buildHeroDestination(t.id, searchQuery)}
                    className="inline-flex min-h-[2.5rem] shrink-0 snap-start items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 sm:text-sm"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              <form onSubmit={onSubmitSearch} role="search" aria-label="Search catalog">
                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow focus-within:border-neutral-300 focus-within:shadow-md sm:flex-row sm:items-stretch">
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
                    className="min-h-[3rem] w-full shrink-0 bg-[var(--brand-blue)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--brand-blue-hover)] sm:w-auto sm:min-h-[3.125rem] sm:rounded-none sm:rounded-br-xl sm:rounded-tr-xl sm:px-8 lg:min-h-[3.25rem]"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
