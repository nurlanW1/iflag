'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Shuffle, ArrowRight } from 'lucide-react';
import { CountryHubFolderGrid } from '@/components/gallery/CountryHubFolderGrid';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';

const GRID_LIMIT = 12;

function shufflePick<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

type ExplorePhase = 'loading' | { items: GalleryCountrySummary[] } | 'empty' | 'error';

const tileShadow =
  'shadow-[0_4px_14px_-8px_rgba(15,23,42,0.14)] hover:shadow-[0_8px_22px_-10px_rgba(15,23,42,0.18)]';

export function LandingFlagGalleryPreview() {
  const [phase, setPhase] = useState<ExplorePhase>('loading');

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      const { ok, data } = await fetchJsonWithRetry<{ countries?: GalleryCountrySummary[] }>(
        '/api/gallery/landing-preview',
        { retries: 2, delayMs: 500 },
      );
      const list = ok && data?.countries ? data.countries : [];
      const rows = shufflePick(list, GRID_LIMIT);
      if (rows.length > 0) {
        setPhase({ items: rows });
      } else if (!ok) {
        setPhase('error');
      } else {
        setPhase('empty');
      }
    } catch {
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loading = phase === 'loading';
  const empty = phase === 'empty';
  const errored = phase === 'error';
  const items = phase !== 'loading' && phase !== 'empty' && phase !== 'error' ? phase.items : [];

  return (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-10 md:py-14 lg:py-16">
      <div className="marketplace-shell">
        {/* Section header */}
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Explore the catalog</p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#2a2a2a] sm:text-2xl">
              Popular country collections
            </h2>
          </div>
          {!loading && !empty && !errored ? (
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 active:scale-95"
              title="Shuffle collections"
            >
              <Shuffle size={15} aria-hidden />
              Shuffle
            </button>
          ) : null}
        </div>

        {loading ? (
          <ul
            className={marketplaceProductCardGridClasses}
            aria-busy="true"
            aria-label="Loading country folders"
          >
            {Array.from({ length: GRID_LIMIT }).map((_, i) => (
              <li
                key={i}
                className={`overflow-hidden rounded-2xl border border-stone-200/80 bg-white ${tileShadow}`}
              >
                <div className="aspect-[4/3] animate-pulse bg-stone-100" />
                <div className="space-y-2 px-3 py-2.5">
                  <div className="h-3.5 w-[70%] animate-pulse rounded bg-stone-100" />
                  <div className="h-2.5 w-[45%] animate-pulse rounded bg-stone-50" />
                </div>
              </li>
            ))}
          </ul>
        ) : empty || errored ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center text-neutral-600">
            <p className="text-base font-medium text-neutral-800">
              {errored ? 'Could not load country folders.' : 'No country folders yet.'}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {errored
                ? 'Check your connection and try again.'
                : 'Import flags from R2 to populate country hubs.'}
            </p>
            {errored ? (
              <button
                type="button"
                onClick={() => void load()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-hover)]"
              >
                <RefreshCw size={16} aria-hidden />
                Retry
              </button>
            ) : null}
          </div>
        ) : (
          <CountryHubFolderGrid countries={items} variant="compact" tileClassName={tileShadow} />
        )}

        {!loading && !empty && !errored ? (
          <div className="mt-8 flex flex-col items-center gap-3 md:mt-10">
            <Link
              href="/gallery"
              className="inline-flex min-h-12 items-center gap-2 justify-center rounded-xl bg-[var(--brand-blue)] px-10 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-blue-hover)] hover:gap-3"
            >
              Browse all countries
              <ArrowRight size={17} aria-hidden />
            </Link>
            <p className="text-xs text-neutral-500">200+ countries · Free official flags included</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
