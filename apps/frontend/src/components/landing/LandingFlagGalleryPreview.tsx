'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { CountryHubFolderGrid } from '@/components/gallery/CountryHubFolderGrid';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

const GRID_LIMIT = 12;

function shufflePick<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

async function fetchCountryHubs(limit: number): Promise<GalleryCountrySummary[]> {
  const res = await fetch('/api/gallery/countries', { cache: 'no-store' });
  if (!res.ok) return [];
  const j = (await res.json()) as { countries?: GalleryCountrySummary[] };
  const list = j.countries ?? [];
  return shufflePick(list, limit);
}

type ExplorePhase = 'loading' | { items: GalleryCountrySummary[] } | 'empty';

export function LandingFlagGalleryPreview() {
  const [phase, setPhase] = useState<ExplorePhase>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchCountryHubs(GRID_LIMIT);
        if (cancelled) return;
        if (rows.length > 0) {
          setPhase({ items: rows });
        } else {
          setPhase('empty');
        }
      } catch {
        if (!cancelled) setPhase('empty');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = phase === 'loading';
  const empty = phase === 'empty';
  const items = phase !== 'loading' && phase !== 'empty' ? phase.items : [];

  return (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-14 md:py-20 lg:py-24">
      <div className="marketplace-shell">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-white via-[#fafaf9] to-neutral-100/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6 md:p-8 lg:rounded-[1.35rem]">
          <div className="mb-8 rounded-xl bg-white/95 px-4 py-5 ring-1 ring-neutral-200/70 sm:mb-10 sm:px-6 sm:py-6">
            <SectionReveal
              hidden={{ opacity: 0, y: 10 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex max-w-3xl flex-col"
            >
              <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
                Explore by country
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
                Each tile is a country folder — open Belgium, Uzbekistan, or any hub to browse every design inside.
                WebP covers appear when uploaded; others show a star until the cover is ready.
              </p>
            </SectionReveal>
          </div>

          {loading ? (
            <ul
              className="grid grid-cols-1 gap-3.5 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"
              aria-busy="true"
              aria-label="Loading country folders"
            >
              {Array.from({ length: GRID_LIMIT }).map((_, i) => (
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
              <p className="text-base font-medium text-neutral-800">No country folders yet.</p>
              <p className="mt-2 text-sm text-neutral-500">Import flags from R2 to populate country hubs.</p>
            </div>
          ) : (
            <CountryHubFolderGrid countries={items} />
          )}

          {!loading && !empty ? (
            <div className="mt-10 flex justify-center md:mt-12">
              <Link
                href="/gallery"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--brand-blue)] px-10 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
              >
                Browse all countries
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
