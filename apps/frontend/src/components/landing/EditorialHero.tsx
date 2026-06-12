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
      className="relative min-h-[15rem] overflow-hidden md:min-h-[18rem] lg:min-h-[clamp(24rem,32vw,44rem)]"
      style={{ background: 'var(--brand-blue)' }}
      aria-labelledby={headingId}
    >
      <div className="marketplace-shell relative z-10 flex flex-col items-center pb-9 pt-8 text-center sm:pb-11 sm:pt-10 lg:pb-14 lg:pt-12">
        <div className="w-full max-w-2xl lg:pt-2">
          <div className="flex flex-col items-center">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                Editorial marketplace
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/25">
                200+ countries · Free flags
              </span>
            </div>

            {/* Heading */}
            <h1
              id={headingId}
              className="mt-4 text-balance text-2xl font-semibold leading-[1.14] tracking-tight text-white sm:mt-5 sm:text-[1.875rem] sm:leading-[1.12] md:text-[2.125rem] lg:text-[2.625rem] lg:leading-[1.1]"
            >
              Professional flag assets for every project
            </h1>

            {/* Subtext */}
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base lg:text-[1.0625rem]">
              Official country flags, vector designs and archives — SVG, PNG, WebP formats with predictable commercial licensing.
            </p>

            {/* Category tabs */}
            <div
              role="toolbar"
              aria-label="Popular catalog categories"
              className="mt-5 flex flex-wrap items-center justify-center gap-2 md:gap-2.5 lg:mt-7"
            >
              {HERO_TABS.map((t) => (
                <Link
                  key={t.id}
                  href={buildHeroDestination(t.id, searchQuery)}
                  className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 px-[0.9375rem] py-2 text-[0.8125rem] font-semibold tracking-tight text-white transition-[border-color,background-color] hover:border-white/55 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-blue)] sm:min-h-0 sm:text-sm"
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Search form — full width */}
        <form onSubmit={onSubmitSearch} className="mt-5 w-full lg:mt-8" role="search" aria-label="Search catalog">
          <div className="flex w-full flex-col overflow-hidden rounded-xl border border-white/20 bg-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] transition-[box-shadow] duration-300 focus-within:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.32)] sm:flex-row sm:items-stretch">
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

          {/* Popular searches */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
              Popular:
            </span>
            {(
              [
                { label: 'United States', slug: 'united-states' },
                { label: 'United Kingdom', slug: 'united-kingdom' },
                { label: 'Germany', slug: 'germany' },
                { label: 'Japan', slug: 'japan' },
                { label: 'France', slug: 'france' },
                { label: 'Canada', slug: 'canada' },
                { label: 'Brazil', slug: 'brazil' },
                { label: 'Australia', slug: 'australia' },
              ] as const
            ).map(({ label, slug }) => (
              <Link
                key={slug}
                href={`/gallery/${slug}`}
                className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/80 transition-colors hover:border-white/45 hover:bg-white/20 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
