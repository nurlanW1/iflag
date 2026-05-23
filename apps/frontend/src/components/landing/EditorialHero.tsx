'use client';

import { useId } from 'react';
import { Search } from 'lucide-react';

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

  return (
    <section
      className="relative min-h-[18rem] overflow-hidden border-b border-neutral-200/90 sm:min-h-[20rem] lg:min-h-[clamp(28rem,34.95vw,48rem)]"
      aria-labelledby={headingId}
    >
      {/* Crop a thin decorative strip off the raster top inside this frame (avoid re-export). */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[-1.75rem] z-0 h-[calc(100%+1.75rem)] bg-cover bg-center bg-no-repeat lg:bg-[length:100%_auto] lg:bg-top"
        style={{ backgroundImage: 'url(/images/mypexel1.webp)' }}
        aria-hidden
      />
      {/* Light left scrim only — keeps type readable without washing out the photograph */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#fafaf9]/76 from-[-5%] via-[#fafaf9]/35 via-[42%] to-transparent to-[88%]"
        aria-hidden
      />
      <div className="marketplace-shell relative z-10 py-7 sm:py-10 lg:py-14">
        <div className="max-w-xl pt-4 sm:pt-9 lg:pt-11">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-600 sm:text-sm">
              Editorial marketplace
            </p>
            <h1
              id={headingId}
              className="mt-3 max-w-xl text-balance text-[clamp(1.6875rem,5.2vw,2.5rem)] font-semibold leading-[1.12] tracking-tight text-[var(--brand-blue)] drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)] sm:text-[2.5rem] lg:text-[2.65rem]"
            >
              A calm marketplace for flags &amp; symbols
            </h1>
            <p className="mt-4 max-w-lg text-[0.948rem] leading-relaxed text-neutral-700 [text-shadow:0_1px_0_rgba(255,255,255,0.55)] sm:text-base">
              Country marks, vectors, and archives — predictable licensing.
            </p>

            <form onSubmit={onSubmitSearch} className="mt-6 lg:mt-8" role="search" aria-label="Search catalog">
              <div className="flex flex-col overflow-hidden rounded-xl border border-white/55 bg-white/90 shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-[border-color,box-shadow] duration-300 focus-within:border-white/80 focus-within:bg-white/95 focus-within:shadow-md sm:flex-row sm:items-stretch">
              <div className="flex min-h-[48px] flex-1 items-center gap-3 px-3.5 sm:px-5 lg:min-h-[3.25rem]">
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
                  className="min-h-[48px] w-full shrink-0 bg-[var(--brand-blue)] px-7 text-base font-medium text-[#fafaf9] transition-colors duration-200 hover:bg-[var(--brand-blue-hover)] sm:w-auto sm:min-h-[3.25rem] sm:rounded-none sm:rounded-r-xl sm:px-9"
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
