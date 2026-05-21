'use client';

import Link from 'next/link';
import { useId } from 'react';
import { Search, Flag } from 'lucide-react';
import type { HeroCategoryTab } from '@/lib/landing/hero-categories';
import { HERO_TABS, HERO_TRENDING } from '@/lib/landing/hero-categories';

type EditorialHeroProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  heroCategoryTab: HeroCategoryTab;
  onHeroCategoryTabChange: (t: HeroCategoryTab) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
};

/** Minimal editorial collage — abstract flag-inspired planes, no stock-photo layout */
function HeroVisualCollage() {
  return (
    <div className="relative mx-auto hidden h-[400px] w-full max-w-xl lg:block lg:h-[520px]" aria-hidden>
      <div className="absolute inset-0 rounded-[1.75rem] bg-[#eef0f2]" />
      <div className="absolute inset-[12%] rounded-[1.35rem] border border-neutral-200/80 bg-[#fafaf9] shadow-[0_24px_60px_-28px_rgba(42,52,65,0.18)]" />
      {/* Muted accent planes */}
      <div
        className="absolute left-[8%] top-[14%] h-[28%] w-[42%] rounded-xl bg-[#b85c5c]/20 ring-1 ring-[#b85c5c]/15"
        style={{ transform: 'rotate(-8deg)' }}
      />
      <div
        className="absolute bottom-[18%] right-[10%] h-[26%] w-[48%] rounded-xl bg-[#5c7aa8]/18 ring-1 ring-[#5c7aa8]/12"
        style={{ transform: 'rotate(6deg)' }}
      />
      <div
        className="absolute right-[18%] top-[22%] h-[14%] w-[34%] rounded-lg bg-[#c9a227]/18 ring-1 ring-[#c9a227]/14"
        style={{ transform: 'rotate(-4deg)' }}
      />
      <div className="absolute left-1/2 top-[42%] flex h-[5.5rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <Flag className="h-10 w-10 text-[#3d4f61]" strokeWidth={1.25} />
      </div>
      <p className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium tracking-wide text-neutral-400">
        Abstract compositions · licensing-ready marks
      </p>
    </div>
  );
}

export function EditorialHero({
  searchQuery,
  onSearchQueryChange,
  heroCategoryTab,
  onHeroCategoryTabChange,
  onSubmitSearch,
}: EditorialHeroProps) {
  const headingId = useId();

  return (
    <section
      className="border-b border-neutral-200/90 bg-[#fafaf9]"
      aria-labelledby={headingId}
    >
      <div className="marketplace-shell py-14 sm:py-16 lg:flex lg:min-h-[640px] lg:items-center lg:py-20 xl:min-h-[650px]">
        <div className="grid w-full gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-24">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-neutral-500">
              Editorial marketplace
            </p>
            <h1
              id={headingId}
              className="mt-5 max-w-xl text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-[#2a2a2a] sm:text-[3rem]"
            >
              A calm marketplace for flags &amp; symbols
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-600 sm:text-[1.0625rem]">
              Country marks, vectors, archives, and organizations — curated with editorial spacing and predictable
              licensing.
            </p>

            <form onSubmit={onSubmitSearch} className="mt-10 max-w-xl" role="search" aria-label="Search catalog">
              <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_12px_40px_-24px_rgba(42,52,65,0.2)] transition-shadow duration-300 focus-within:border-neutral-300 focus-within:shadow-[0_16px_48px_-22px_rgba(42,52,65,0.22)] sm:flex-row sm:items-stretch">
                <div className="flex min-h-14 flex-1 items-center gap-3 px-4 sm:px-5 lg:min-h-[3.75rem]">
                  <Search className="h-6 w-6 shrink-0 text-neutral-400" aria-hidden />
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
                  className="min-h-14 shrink-0 bg-[#3d4f61] px-8 text-base font-medium text-[#fafaf9] transition-colors duration-200 hover:bg-[#354558] sm:min-h-[3.75rem] sm:rounded-none sm:rounded-r-xl sm:px-10"
                >
                  Search
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="w-full text-sm font-medium text-neutral-500 sm:w-auto sm:py-1.5">Trending</span>
                {HERO_TRENDING.map((term) => (
                  <Link
                    key={term}
                    href={`/browse?q=${encodeURIComponent(term.toLowerCase())}`}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:border-neutral-400 hover:text-[#2a2a2a]"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </form>

            <div className="mt-10">
              <p className="text-sm font-medium text-neutral-500">Quick scope</p>
              <nav className="mt-3 flex flex-wrap gap-2" aria-label="Quick categories">
                {HERO_TABS.map(({ id, label }) => {
                  const active = heroCategoryTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onHeroCategoryTabChange(id)}
                      aria-current={active ? 'true' : undefined}
                      className={`rounded-lg border px-4 py-2.5 text-base font-medium transition-colors duration-200 ${
                        active
                          ? 'border-[#3d4f61] bg-[#3d4f61] text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-[#2a2a2a]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-500">
                Scope applies when you press Search — combine with any query above.
              </p>
            </div>
          </div>

          <HeroVisualCollage />
        </div>
      </div>
    </section>
  );
}
