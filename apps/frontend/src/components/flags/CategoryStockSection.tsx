'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Camera, Clapperboard, FileCode2, Gift, Image as ImageIcon, Shuffle } from 'lucide-react';
import { ShutterstockCard } from '@/components/flags/ShutterstockCard';
import type { CategoryKind } from '@/types/marketplace';

type StockSource = 'shutterstock' | 'pixabay' | 'pexels';
type StockFilterId = 'all' | 'free' | 'vector' | 'photo' | 'video' | 'png' | 'jpg' | 'icon';

interface StockImage {
  id: string;
  description: string;
  thumbUrl: string;
  shutterUrl?: string;
  sourceUrl?: string;
  source: StockSource;
  licenseType?: 'free' | 'paid';
  mediaType?: StockFilterId;
}

interface Props {
  categoryName: string;
  categoryKind: CategoryKind;
  searchQuery?: string;
}

const STOCK_PAGE_SIZE = 12;

const STOCK_FILTERS = [
  { id: 'all', label: 'All', Icon: Shuffle },
  { id: 'free', label: 'Free', Icon: Gift },
  { id: 'vector', label: 'Vector', Icon: FileCode2 },
  { id: 'photo', label: 'Photo', Icon: Camera },
  { id: 'video', label: 'Video', Icon: Clapperboard },
  { id: 'png', label: 'PNG', Icon: ImageIcon },
  { id: 'jpg', label: 'JPG', Icon: ImageIcon },
  { id: 'icon', label: 'Icon', Icon: BadgeCheck },
] as const;

const CATEGORY_SEARCH: Record<CategoryKind, { query: string; defaultFilter: StockFilterId }> = {
  country_flags: { query: 'national country flags', defaultFilter: 'all' },
  usa_state_flags: { query: 'usa state flags', defaultFilter: 'all' },
  autonomy_flags: { query: 'regional autonomous territory flags', defaultFilter: 'all' },
  historical_flags: { query: 'historical old national flags', defaultFilter: 'all' },
  organization_flags: { query: 'international organization flags', defaultFilter: 'all' },
  institution_flags: { query: 'government institution federation flags', defaultFilter: 'all' },
  flag_mockups: { query: 'flag mockup template', defaultFilter: 'photo' },
  flag_videos: { query: 'flag waving video', defaultFilter: 'video' },
  flag_icons: { query: 'flag icon vector set', defaultFilter: 'icon' },
  country_coats: { query: 'country coat of arms national emblem', defaultFilter: 'all' },
  historical_coats: { query: 'historical coat of arms heraldry emblem', defaultFilter: 'all' },
  football_clubs: { query: 'football club logo crest', defaultFilter: 'all' },
  other: { query: 'flag design collection', defaultFilter: 'all' },
};

function sourceAllowedForFilter(source: StockSource, filter: StockFilterId): boolean {
  if (filter === 'free') return source !== 'shutterstock';
  if (filter === 'video') return source === 'pexels';
  return true;
}

function interleaveStockGroups(groups: StockImage[][]): StockImage[] {
  const output: StockImage[] = [];
  const max = Math.max(0, ...groups.map((group) => group.length));
  const seen = new Set<string>();

  for (let i = 0; i < max; i += 1) {
    for (const group of groups) {
      const item = group[i];
      if (!item) continue;
      const key = `${item.source}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(item);
    }
  }

  return output;
}

function queryForSource(kind: CategoryKind, source: StockSource, searchQuery?: string): string {
  const base = searchQuery?.trim() || CATEGORY_SEARCH[kind]?.query || 'flag design collection';
  if (source === 'shutterstock' || searchQuery?.trim()) return base;
  if (kind === 'country_flags') return 'country flag';
  if (kind === 'historical_flags') return 'historical flag';
  if (kind === 'flag_icons') return 'flag icon vector';
  if (kind === 'flag_videos') return 'flag waving';
  if (kind === 'football_clubs') return 'football club crest logo';
  return base.replace(/\bnational\b/gi, '').replace(/\s+/g, ' ').trim();
}

export function CategoryStockSection({ categoryName, categoryKind, searchQuery }: Props) {
  const initialFilter = CATEGORY_SEARCH[categoryKind]?.defaultFilter ?? 'all';
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockHasMore, setStockHasMore] = useState(false);
  const [stockFetched, setStockFetched] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilterId>(initialFilter);
  const stockPageRef = useRef(1);
  const requestKeyRef = useRef('');

  const fetchStockImages = useCallback(async (page: number, filter: StockFilterId) => {
    setStockLoading(true);
    try {
      const endpoints: StockSource[] = (['shutterstock', 'pixabay', 'pexels'] as StockSource[]).filter((source) =>
        sourceAllowedForFilter(source, filter),
      );
      const settled = await Promise.allSettled(
        endpoints.map(async (source) => {
          const q = encodeURIComponent(queryForSource(categoryKind, source, searchQuery));
          const r = await fetch(`/api/${source}/search?q=${q}&per_page=${STOCK_PAGE_SIZE}&page=${page}&filter=${filter}`);
          const res = r.ok
            ? (await r.json()) as { results?: StockImage[]; hasMore?: boolean }
            : { results: [], hasMore: false };
          return { results: res.results ?? [], hasMore: Boolean(res.hasMore) };
        }),
      );
      const batches = settled
        .map((item) => (item.status === 'fulfilled' ? item.value : null))
        .filter((item): item is { results: StockImage[]; hasMore: boolean } => Boolean(item));
      const mixed = interleaveStockGroups(batches.map((batch) => batch.results));

      setStockImages((prev) => {
        const combined = page === 1 ? mixed : [...prev, ...mixed];
        const seen = new Set<string>();
        return combined.filter((img) => {
          const key = `${img.source}:${img.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      setStockHasMore(batches.some((batch) => batch.hasMore));
    } catch {
      setStockHasMore(false);
    } finally {
      setStockLoading(false);
      setStockFetched(true);
    }
  }, [categoryKind, searchQuery]);

  useEffect(() => {
    const requestKey = `${categoryKind}|${searchQuery ?? ''}|${stockFilter}`;
    if (requestKeyRef.current === requestKey) return;
    requestKeyRef.current = requestKey;
    stockPageRef.current = 1;
    setStockImages([]);
    setStockFetched(false);
    setStockHasMore(false);
    void fetchStockImages(1, stockFilter);
  }, [categoryKind, searchQuery, stockFilter, fetchStockImages]);

  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && stockHasMore && !stockLoading) {
          const nextPage = stockPageRef.current + 1;
          stockPageRef.current = nextPage;
          void fetchStockImages(nextPage, stockFilter);
        }
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchStockImages, stockHasMore, stockLoading, stockFilter]);

  return (
    <section className="mt-12 border-t border-neutral-200 pt-8" aria-labelledby="category-stock-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="category-stock-heading" className="text-base font-semibold text-[#2a2a2a]">
            More {categoryName.toLowerCase()} from stock providers
          </h2>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
            Shutterstock + Pixabay + Pexels
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Filter category stock images">
          {STOCK_FILTERS.map(({ id, label, Icon }) => {
            const active = stockFilter === id;
            return (
              <button
                key={id}
                type="button"
                title={`Show ${label.toLowerCase()} stock results`}
                onClick={() => setStockFilter(id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  active ? 'bg-[#111827] text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <Icon size={12} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {stockLoading && stockImages.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
              <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-50" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {stockImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {stockImages.map((img) => (
            <ShutterstockCard key={`${img.source}-${img.id}`} {...img} />
          ))}
        </div>
      ) : null}

      {stockHasMore ? <div ref={sentinelRef} className="h-2" /> : null}

      {stockLoading && stockImages.length > 0 ? (
        <div className="flex justify-center py-6">
          <svg className="h-6 w-6 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : null}

      {stockFetched && !stockLoading && stockImages.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          No stock provider results found for {categoryName.toLowerCase()}.
        </p>
      ) : null}

      {stockFetched && !stockHasMore && stockImages.length > 0 ? (
        <p className="mt-6 text-center text-xs text-neutral-400">
          * Stock images open on their original provider. Shutterstock items require licensing; Pixabay and Pexels items are free-provider results.
        </p>
      ) : null}
    </section>
  );
}
