'use client';

import { useId } from 'react';
import { Search, Flag } from 'lucide-react';

type EditorialHeroProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
};

/** Editorial collage — abstract flag-inspired planes (hero visual, right column). */
function HeroAbstractIllustration() {
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

          <div className="flex justify-center lg:justify-end">
            <HeroAbstractIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
