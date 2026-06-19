'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import Link from 'next/link';

const INITIAL_SHOW = 30;
const LOAD_MORE_STEP = 30;

type Phase = 'loading' | 'ready' | 'empty' | 'error';

export function LandingFlagGalleryPreview() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [all, setAll] = useState<GalleryCountrySummary[]>([]);
  const [visible, setVisible] = useState(INITIAL_SHOW);

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      const { ok, data } = await fetchJsonWithRetry<{ countries?: GalleryCountrySummary[] }>(
        '/api/gallery/landing-preview?full=1',
        { retries: 2, delayMs: 500 },
      );
      const list = ok && data?.countries ? data.countries : [];
      if (list.length > 0) {
        setAll(list);
        setVisible(INITIAL_SHOW);
        setPhase('ready');
      } else {
        setPhase(ok ? 'empty' : 'error');
      }
    } catch {
      setPhase('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const shown = all.slice(0, visible);
  const hasMore = visible < all.length;

  if (phase === 'loading') {
    return (
      <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-7 md:py-9">
        <div className="marketplace-shell">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {Array.from({ length: INITIAL_SHOW }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
                <div className="aspect-[4/3] animate-pulse bg-stone-100" />
                <div className="px-2 py-1.5">
                  <div className="h-2.5 w-3/4 animate-pulse rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'error' || phase === 'empty') {
    return (
      <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-7 md:py-9">
        <div className="marketplace-shell">
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center text-neutral-600">
            <p className="text-base font-medium text-neutral-800">
              {phase === 'error' ? 'Could not load countries.' : 'No country folders yet.'}
            </p>
            {phase === 'error' && (
              <button
                type="button"
                onClick={() => void load()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-hover)]"
              >
                <RefreshCw size={16} aria-hidden />
                Retry
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-7 md:py-9">
      <div className="marketplace-shell">
        {/* Dense grid — smaller cards, more countries visible */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {shown.map((country, idx) => (
            <Link
              key={country.id || country.slug}
              href={`/gallery/${encodeURIComponent(country.slug)}`}
              className="group block overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/40 hover:shadow-md"
              style={{
                animationDelay: `${Math.min(idx, 20) * 20}ms`,
              }}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50">
                <CountryHubFolderCover
                  countryName={country.name}
                  coverUrl={country.webp_cover_url ?? country.thumbnail}
                  hasWebpCover={country.has_webp_cover}
                  imageClassName="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.04]"
                />
                {country.code ? (
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/35 px-1 py-0.5 font-mono text-[8px] font-bold uppercase text-white">
                    {country.code}
                  </span>
                ) : null}
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-[11px] font-semibold text-stone-800 sm:text-xs">
                  {country.name}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Show more / count footer */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisible((v) => Math.min(v + LOAD_MORE_STEP, all.length))}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-8 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Show more
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                +{Math.min(LOAD_MORE_STEP, all.length - visible)}
              </span>
            </button>
          ) : null}
          <p className="text-xs text-neutral-400">
            {shown.length} of {all.length} countries
          </p>
        </div>
      </div>
    </section>
  );
}
