'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  LayoutGrid,
  Rows3,
  Compass,
  Building2,
  Map,
  Clock3,
  X,
  Sparkles,
  Globe2,
  FileImage,
  SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { CountryHubFolderGrid } from '@/components/gallery/CountryHubFolderGrid';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';

type Country = GalleryCountrySummary;

type ViewMode = 'grid' | 'list';
type SortKey = 'name-asc' | 'name-desc' | 'designs-desc' | 'designs-asc';

const KIND_TABS: ReadonlyArray<{ id: string | null; label: string; Icon: LucideIcon }> = [
  { id: null, label: 'All', Icon: Compass },
  { id: 'organizations', label: 'Organizations', Icon: Building2 },
  { id: 'autonomy', label: 'Autonomy', Icon: Map },
  { id: 'historical', label: 'Historical', Icon: Clock3 },
];

const SORT_OPTIONS: ReadonlyArray<{ id: SortKey; label: string }> = [
  { id: 'name-asc', label: 'Name · A → Z' },
  { id: 'name-desc', label: 'Name · Z → A' },
  { id: 'designs-desc', label: 'Most designs' },
  { id: 'designs-asc', label: 'Fewest designs' },
];

function GalleryContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const region = sp.get('region');
  const kind = sp.get('kind');

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const initialQ = sp.get('q') ?? '';
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [view, setView] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('name-asc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterLabel = useMemo(() => {
    const ks = kind?.trim();
    const rg = region?.trim();
    if (ks === 'organizations') return 'Organizations';
    if (ks === 'autonomy') return 'Autonomy regions';
    if (ks === 'historical') return 'Historical flags';
    if (rg) return rg;
    return null;
  }, [kind, region]);

  useEffect(() => {
    const q = sp.get('q') ?? '';
    setSearchQuery(q);
  }, [sp]);

  useEffect(() => {
    const q = new URLSearchParams();
    if (region?.trim()) q.set('region', region.trim());
    if (kind?.trim()) q.set('kind', kind.trim());
    const path = `/api/gallery/countries${q.size > 0 ? `?${q.toString()}` : ''}`;
    void loadCountries(path);
  }, [region, kind]);

  useEffect(() => {
    const q = sp.get('q')?.trim();
    if (!q) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/gallery/resolve-country?q=${encodeURIComponent(q)}`, {
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { slug?: string | null };
        const slug = data.slug?.trim();
        if (!slug || cancelled) return;
        const params = new URLSearchParams();
        if (region?.trim()) params.set('region', region.trim());
        if (kind?.trim()) params.set('kind', kind.trim());
        const suffix = params.size > 0 ? `?${params.toString()}` : '';
        router.replace(`/gallery/${encodeURIComponent(slug)}${suffix}`);
      } catch {
        /* keep filtered gallery list */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sp, region, kind, router]);

  const loadCountries = async (path = '/api/gallery/countries') => {
    setLoading(true);
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildHref = useCallback(
    (nextKind: string | null) => {
      const params = new URLSearchParams();
      if (region?.trim()) params.set('region', region.trim());
      if (nextKind) params.set('kind', nextKind);
      return `/gallery${params.size > 0 ? `?${params.toString()}` : ''}`;
    },
    [region],
  );

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = q
      ? countries.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.code ? c.code.toLowerCase().includes(q) : false),
        )
      : [...countries];

    list.sort((a, b) => {
      switch (sortKey) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'designs-desc':
          return (b.design_count ?? b.count) - (a.design_count ?? a.count) || a.name.localeCompare(b.name);
        case 'designs-asc':
          return (a.design_count ?? a.count) - (b.design_count ?? b.count) || a.name.localeCompare(b.name);
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [countries, searchQuery, sortKey]);

  const totalDesigns = useMemo(
    () => countries.reduce((acc, c) => acc + (c.design_count ?? c.count ?? 0), 0),
    [countries],
  );

  const activeKind = kind?.trim() || null;

  return (
    <main className="min-h-screen bg-stone-50">
      <section className="relative min-h-[min(34dvh,300px)] overflow-hidden border-b border-stone-200/80 bg-gradient-to-br from-[#0a3b44] via-[#0d4c5b] to-[#0a3b44] sm:min-h-[min(42dvh,400px)] md:min-h-[min(48dvh,480px)] lg:min-h-[min(48dvh,560px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background:
              'radial-gradient(circle at 18% 30%, #60a5fa 0%, transparent 38%), radial-gradient(circle at 82% 70%, #2563eb 0%, transparent 42%)',
          }}
        />
        <div className="relative marketplace-shell pb-11 pt-11 sm:pb-16 sm:pt-14 md:pb-16 md:pt-16 lg:pb-24 lg:pt-20">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
            <Sparkles size={13} className="text-[#7adcef]" aria-hidden />
            Flag library
          </div>
          <h1 className="mt-3 max-w-[min(100%,36rem)] text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:mt-4 sm:max-w-[min(100%,52rem)] sm:text-4xl lg:max-w-[min(100%,90rem)] lg:text-[2.65rem] xl:text-6xl xl:leading-[1.06]">
            Browse high-quality flag collections by country
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:mt-5 sm:text-lg md:max-w-3xl xl:text-xl">
            Country folders with WebP previews — open a hub to see designs and download files inside.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/75 sm:mt-8 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-white/15 backdrop-blur">
              <Globe2 size={13} aria-hidden /> {countries.length} country folders
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-white/15 backdrop-blur">
              <FileImage size={13} aria-hidden /> {totalDesigns.toLocaleString()} designs inside
            </span>
            {filterLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-3 py-1 font-semibold text-white shadow-sm">
                {filterLabel}
                <Link href="/gallery" aria-label="Clear filter" className="-mr-1 ml-1 rounded-full p-0.5 hover:bg-white/15">
                  <X size={12} />
                </Link>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 -mt-6 border-b border-stone-200/60 bg-stone-50/92 backdrop-blur-md">
        <div className="marketplace-shell pt-5 pb-2 sm:pt-6 sm:pb-1">
          <div className="rounded-2xl border border-stone-200/85 bg-white/98 px-3 py-3 shadow-[0_6px_24px_-12px_rgba(15,23,42,0.12)] ring-1 ring-stone-100/90 backdrop-blur-md sm:px-4 lg:shadow-[0_12px_36px_-18px_rgba(15,23,42,0.14)]">
            <div className="flex w-full flex-col gap-3 min-[620px]:flex-row min-[620px]:flex-wrap min-[620px]:items-center">
              <div className="relative min-h-11 w-full min-w-0 flex-1 md:min-w-[14rem]">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={18}
                  aria-hidden
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by country or ISO code…"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/90 py-3 pl-11 pr-10 text-base text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/22 sm:text-sm"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 min-[620px]:hidden"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                aria-haspopup="dialog"
              >
                <SlidersHorizontal size={17} aria-hidden />
                Filters
              </button>

              <div className="hidden flex-wrap items-center gap-1.5 min-[620px]:flex">
                {KIND_TABS.map(({ id, label, Icon }) => {
                  const active = (id ?? null) === activeKind;
                  return (
                    <Link
                      key={label}
                      href={buildHref(id)}
                      className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/30'
                          : 'bg-stone-100/80 text-stone-700 hover:bg-stone-200/80'
                      }`}
                    >
                      <Icon size={13} aria-hidden />
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex w-full min-w-0 items-center gap-2 min-[620px]:ml-auto min-[620px]:w-auto">
                <div className="relative min-w-0 flex-1 sm:flex-initial">
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    aria-label="Sort countries"
                    className="h-11 w-full min-h-[44px] appearance-none rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2 pl-3 pr-10 text-sm font-semibold text-stone-800 transition-all hover:bg-white focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 sm:text-xs md:w-auto md:min-w-[10.5rem]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden>
                    ▾
                  </span>
                </div>

                <div className="flex shrink-0 items-center rounded-xl bg-stone-100/90 p-1">
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                    className={`flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg transition-colors ${
                      view === 'grid' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <LayoutGrid size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    aria-label="List view"
                    aria-pressed={view === 'list'}
                    className={`flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg transition-colors ${
                      view === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Rows3 size={18} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[45] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-2xl border border-stone-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-12px_40px_-14px_rgba(15,23,42,0.2)]">
            <div className="mx-auto mb-5 h-1 w-11 rounded-full bg-stone-200" aria-hidden />
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wide text-stone-500">Browse by type</p>
            <ul className="mx-0 mb-6 list-none space-y-2 p-0">
              {KIND_TABS.map(({ id, label, Icon }) => {
                const active = (id ?? null) === activeKind;
                return (
                  <li key={label} className="list-none">
                    <Link
                      href={buildHref(id)}
                      onClick={() => setFiltersOpen(false)}
                      className={`flex min-h-12 touch-manipulation items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                        active
                          ? 'bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/25'
                          : 'bg-stone-50 text-stone-800 ring-1 ring-stone-200/90 hover:bg-stone-100'
                      }`}
                    >
                      <Icon size={18} aria-hidden />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-stone-900 py-3.5 text-base font-semibold text-white hover:bg-stone-800"
              onClick={() => setFiltersOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      <div className="marketplace-shell py-7 sm:py-11 lg:py-14">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-medium text-stone-500 sm:text-sm">
            {loading ? (
              'Loading countries…'
            ) : (
              <>
                <span className="font-semibold text-stone-900">{filteredCountries.length}</span>{' '}
                {filteredCountries.length === 1 ? 'country' : 'countries'}
                {searchQuery ? (
                  <>
                    {' '}for{' '}
                    <span className="font-semibold text-stone-900">“{searchQuery}”</span>
                  </>
                ) : null}
              </>
            )}
          </p>
        </div>

        {loading ? (
          <SkeletonGrid view={view} />
        ) : filteredCountries.length === 0 ? (
          <EmptyState
            hasSearch={!!searchQuery}
            hasFilter={!!filterLabel}
            onClearSearch={() => setSearchQuery('')}
            onClearFilter={() => router.push('/gallery')}
          />
        ) : view === 'grid' ? (
          <CountryHubFolderGrid countries={filteredCountries} variant="compact" />
        ) : (
          <CardList countries={filteredCountries} />
        )}
      </div>
    </main>
  );
}

function CardList({ countries }: { countries: Country[] }) {
  return (
    <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
      {countries.map((country) => (
        <li key={`${country.code ?? 'x'}-${country.slug}-row`}>
          <Link
            href={`/gallery/${country.slug}`}
            className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-stone-50 sm:gap-4 sm:px-4 sm:py-3.5"
          >
            <div
              className={
                country.has_webp_cover
                  ? 'relative h-14 w-20 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-24'
                  : 'relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-50 ring-1 ring-stone-200 sm:h-16 sm:w-24'
              }
            >
              <CountryHubFolderCover
                countryName={country.name}
                coverUrl={country.webp_cover_url ?? country.thumbnail}
                hasWebpCover={country.has_webp_cover}
                imageClassName="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-stone-900 sm:text-[15px]">
                  {country.name}
                </h3>
                {country.code ? (
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-stone-600">
                    {country.code}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-stone-500 sm:text-xs">
                {country.design_count ?? country.count}{' '}
                {country.design_count === 1 || (!country.design_count && country.count === 1)
                  ? 'design'
                  : 'designs'}{' '}
                in folder
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#2563eb] opacity-0 transition-opacity group-hover:opacity-100">
              View <ArrowRight size={14} aria-hidden />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SkeletonGrid({ view }: { view: ViewMode }) {
  if (view === 'list') {
    return (
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-16 w-24 shrink-0 animate-pulse rounded-lg bg-stone-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 animate-pulse rounded bg-stone-100" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-stone-100" />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className={marketplaceProductCardGridClasses}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white"
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-stone-100" />
          <div className="space-y-2 px-3.5 py-3">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-stone-100" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasSearch,
  hasFilter,
  onClearSearch,
  onClearFilter,
}: {
  hasSearch: boolean;
  hasFilter: boolean;
  onClearSearch: () => void;
  onClearFilter: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb]/10 text-[#2563eb]">
        <Search size={22} aria-hidden />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-stone-900">No countries match</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
        Try a different search term or clear the current filter to browse the full catalog.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {hasSearch ? (
          <button
            type="button"
            onClick={onClearSearch}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            Clear search
          </button>
        ) : null}
        {hasFilter ? (
          <button
            type="button"
            onClick={onClearFilter}
            className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/30 transition-colors hover:bg-[#3b82f6]"
          >
            View all countries
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-stone-50">
          <div
            className="h-9 w-9 animate-spin rounded-full border-[3px] border-stone-200 border-t-[#2563eb]"
            aria-hidden
          />
        </main>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
