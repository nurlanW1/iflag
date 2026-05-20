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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { FLAG_THUMB_PLACEHOLDER_DATA_URL } from '@/lib/flag-thumbnail-fallback';

interface Country {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name-asc' | 'name-desc' | 'files-desc' | 'files-asc';

const KIND_TABS: ReadonlyArray<{ id: string | null; label: string; Icon: LucideIcon }> = [
  { id: null, label: 'All', Icon: Compass },
  { id: 'organizations', label: 'Organizations', Icon: Building2 },
  { id: 'autonomy', label: 'Autonomy', Icon: Map },
  { id: 'historical', label: 'Historical', Icon: Clock3 },
];

const SORT_OPTIONS: ReadonlyArray<{ id: SortKey; label: string }> = [
  { id: 'name-asc', label: 'Name · A → Z' },
  { id: 'name-desc', label: 'Name · Z → A' },
  { id: 'files-desc', label: 'Most files' },
  { id: 'files-asc', label: 'Fewest files' },
];

function GalleryContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const region = sp.get('region');
  const kind = sp.get('kind');

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('name-asc');

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
    const q = new URLSearchParams();
    if (region?.trim()) q.set('region', region.trim());
    if (kind?.trim()) q.set('kind', kind.trim());
    const path = `/api/gallery/countries${q.size > 0 ? `?${q.toString()}` : ''}`;
    void loadCountries(path);
  }, [region, kind]);

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
        case 'files-desc':
          return b.count - a.count || a.name.localeCompare(b.name);
        case 'files-asc':
          return a.count - b.count || a.name.localeCompare(b.name);
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [countries, searchQuery, sortKey]);

  const totalFiles = useMemo(
    () => countries.reduce((acc, c) => acc + (c.count || 0), 0),
    [countries],
  );

  const activeKind = kind?.trim() || null;

  return (
    <main className="min-h-screen bg-stone-50">
      <section className="relative min-h-[min(58dvh,520px)] overflow-hidden border-b border-stone-200/80 bg-gradient-to-br from-[#0a3b44] via-[#0d4c5b] to-[#0a3b44] sm:min-h-[min(50dvh,600px)] lg:min-h-[min(48dvh,640px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background:
              'radial-gradient(circle at 18% 30%, #00b8d4 0%, transparent 38%), radial-gradient(circle at 82% 70%, #009ab6 0%, transparent 42%)',
          }}
        />
        <div className="relative marketplace-shell pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-20">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
            <Sparkles size={13} className="text-[#7adcef]" aria-hidden />
            Flag library
          </div>
          <h1 className="mt-4 max-w-[min(100%-0.5rem,58rem)] text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:max-w-[min(100%,90rem)] xl:text-6xl xl:leading-[1.06]">
            Browse high-quality flag collections by country
          </h1>
          <p className="mt-5 max-w-none text-base leading-relaxed text-white/75 sm:mt-6 sm:text-lg xl:text-xl">
            Curated raster &amp; vector previews — search, filter and open a folder to view every shape, format and resolution.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-white/15 backdrop-blur">
              <Globe2 size={13} aria-hidden /> {countries.length} countries
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-white/15 backdrop-blur">
              <FileImage size={13} aria-hidden /> {totalFiles.toLocaleString()} files
            </span>
            {filterLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#009ab6] px-3 py-1 font-semibold text-white shadow-sm">
                {filterLabel}
                <Link href="/gallery" aria-label="Clear filter" className="-mr-1 ml-1 rounded-full p-0.5 hover:bg-white/15">
                  <X size={12} />
                </Link>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 -mt-6 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md">
        <div className="marketplace-shell pt-6 pb-1">
          <div className="rounded-2xl border border-stone-200/80 bg-white/95 px-3 py-3 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.18)] ring-1 ring-stone-100 backdrop-blur sm:px-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[14rem]">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={17}
                  aria-hidden
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by country or ISO code…"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/80 py-2.5 pl-10 pr-9 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-[#009ab6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#009ab6]/20"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </div>

              <div className="hidden flex-wrap items-center gap-1.5 lg:flex">
                {KIND_TABS.map(({ id, label, Icon }) => {
                  const active = (id ?? null) === activeKind;
                  return (
                    <Link
                      key={label}
                      href={buildHref(id)}
                      className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#009ab6] text-white shadow-sm shadow-[#009ab6]/30'
                          : 'bg-stone-100/80 text-stone-700 hover:bg-stone-200/80'
                      }`}
                    >
                      <Icon size={13} aria-hidden />
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    aria-label="Sort countries"
                    className="appearance-none rounded-xl border border-stone-200 bg-stone-50/80 py-2.5 pl-3 pr-9 text-xs font-semibold text-stone-700 transition-all hover:bg-white focus:border-[#009ab6] focus:outline-none focus:ring-2 focus:ring-[#009ab6]/20"
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

                <div className="hidden items-center rounded-xl bg-stone-100/80 p-1 sm:flex">
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      view === 'grid' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    aria-label="List view"
                    aria-pressed={view === 'list'}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      view === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Rows3 size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 lg:hidden">
              {KIND_TABS.map(({ id, label, Icon }) => {
                const active = (id ?? null) === activeKind;
                return (
                  <Link
                    key={label}
                    href={buildHref(id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-[#009ab6] text-white'
                        : 'bg-stone-100/80 text-stone-700 hover:bg-stone-200/80'
                    }`}
                  >
                    <Icon size={12} aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="marketplace-shell py-8 sm:py-12 lg:py-14">
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
          <CardGrid countries={filteredCountries} />
        ) : (
          <CardList countries={filteredCountries} />
        )}
      </div>
    </main>
  );
}

function CardGrid({ countries }: { countries: Country[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 xs:gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 lg:gap-7 xl:grid-cols-6 2xl:grid-cols-6 min-[1800px]:grid-cols-7 min-[1800px]:gap-8">
      {countries.map((country, idx) => (
        <motion.div
          key={`${country.code ?? 'x'}-${country.slug}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: Math.min(idx, 14) * 0.015 }}
        >
          <Link
            href={`/gallery/${country.slug}`}
            className="group block overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#009ab6]/50 hover:shadow-[0_12px_30px_-14px_rgba(0,154,182,0.45)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
              <img
                src={country.thumbnail?.trim() || FLAG_THUMB_PLACEHOLDER_DATA_URL}
                alt={`${country.name} flag`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  el.src = FLAG_THUMB_PLACEHOLDER_DATA_URL;
                }}
              />
              {country.code ? (
                <span className="absolute left-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                  {country.code}
                </span>
              ) : null}
              <span className="absolute right-2 top-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-700 shadow-sm ring-1 ring-stone-200 backdrop-blur">
                {country.count}
              </span>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-1.5 bg-gradient-to-t from-black/55 to-transparent px-2 py-2 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                View files <ArrowRight size={13} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-3.5 sm:py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-stone-900">{country.name}</h3>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {country.count} {country.count === 1 ? 'file' : 'files'}
                </p>
              </div>
              <ArrowRight
                size={15}
                className="shrink-0 text-stone-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#009ab6]"
                aria-hidden
              />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
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
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 sm:h-16 sm:w-24">
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
              <img
                src={country.thumbnail?.trim() || FLAG_THUMB_PLACEHOLDER_DATA_URL}
                alt={`${country.name} flag`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  el.src = FLAG_THUMB_PLACEHOLDER_DATA_URL;
                }}
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
                {country.count} {country.count === 1 ? 'flag file' : 'flag files'} available
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#009ab6] opacity-0 transition-opacity group-hover:opacity-100">
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
    <div className="grid grid-cols-2 gap-4 xs:gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 lg:gap-7 xl:grid-cols-6 2xl:grid-cols-6 min-[1800px]:grid-cols-7 min-[1800px]:gap-8">
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
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#009ab6]/10 text-[#009ab6]">
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
            className="rounded-xl bg-[#009ab6] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#009ab6]/30 transition-colors hover:bg-[#008aaa]"
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
            className="h-9 w-9 animate-spin rounded-full border-[3px] border-stone-200 border-t-[#009ab6]"
            aria-hidden
          />
        </main>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
