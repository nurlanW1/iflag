'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import type { Category } from '@/types/marketplace';
import { MarketplaceProductCard } from './MarketplaceProductCard';

type TierFilter = 'all' | 'free' | 'pro';
type SortKey = 'newest' | 'oldest' | 'title' | 'popular';

type ApiResponse = {
  data: PublicProduct[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

async function fetchProducts(params: URLSearchParams): Promise<ApiResponse> {
  const res = await fetch(`/api/marketplace/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to load products');
  }
  return res.json();
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/marketplace/categories');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data as Category[];
}

function syncBrowseUrl(
  opts: {
    q: string;
    category: string;
    tier: TierFilter;
    sort: SortKey;
    page: number;
    hasFreeDownload: boolean;
  },
  pathname: string
) {
  const url = new URL(typeof window !== 'undefined' ? window.location.href : 'http://local');
  url.pathname = pathname;
  if (opts.q.trim()) url.searchParams.set('q', opts.q.trim());
  else url.searchParams.delete('q');
  if (opts.category) url.searchParams.set('category', opts.category);
  else url.searchParams.delete('category');
  if (opts.tier !== 'all') url.searchParams.set('tier', opts.tier);
  else url.searchParams.delete('tier');
  if (opts.sort !== 'newest') url.searchParams.set('sort', opts.sort);
  else url.searchParams.delete('sort');
  if (opts.hasFreeDownload) url.searchParams.set('hasFreeDownload', 'true');
  else url.searchParams.delete('hasFreeDownload');
  if (opts.page > 1) url.searchParams.set('page', String(opts.page));
  else url.searchParams.delete('page');
  window.history.replaceState({}, '', url.pathname + url.search);
}

export function ProductBrowseSection({
  fixedCategorySlug,
  syncUrl = true,
  className = '',
}: {
  fixedCategorySlug?: string;
  syncUrl?: boolean;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState(
    fixedCategorySlug ?? searchParams.get('category') ?? ''
  );
  const [draftQ, setDraftQ] = useState(searchParams.get('q') ?? '');
  const [appliedQ, setAppliedQ] = useState(searchParams.get('q') ?? '');
  const [tier, setTier] = useState<TierFilter>(
    (searchParams.get('tier') as TierFilter) || 'all'
  );
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get('sort') as SortKey) || 'newest'
  );
  const [freePreviewOnly, setFreePreviewOnly] = useState(
    searchParams.get('hasFreeDownload') === 'true' ||
      searchParams.get('hasFreeDownload') === '1'
  );
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));
  const [items, setItems] = useState<PublicProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const categoryMap = Object.fromEntries(
    categories.filter((c) => c.isApproved).map((c) => [c.id, c.name])
  );

  const runQuery = useCallback(
    async (nextPage: number, append: boolean) => {
      const params = new URLSearchParams();
      params.set('page', String(nextPage));
      params.set('limit', '24');
      params.set('sort', sort);
      if (appliedQ.trim()) params.set('q', appliedQ.trim());
      if (tier !== 'all') params.set('tier', tier);
      if (freePreviewOnly) params.set('hasFreeDownload', 'true');
      const slug = fixedCategorySlug ?? categorySlug;
      if (slug) params.set('categorySlug', slug);

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await fetchProducts(params);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(nextPage);
        setItems((prev) => (append ? [...prev, ...res.data] : res.data));
        if (syncUrl && !fixedCategorySlug && typeof window !== 'undefined') {
          syncBrowseUrl(
            {
              q: appliedQ,
              category: categorySlug,
              tier,
              sort,
              page: nextPage,
              hasFreeDownload: freePreviewOnly,
            },
            window.location.pathname
          );
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [appliedQ, tier, sort, categorySlug, fixedCategorySlug, syncUrl, freePreviewOnly]
  );

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, [retryKey]);

  /** Filters / search (applied) change → first page */
  useEffect(() => {
    runQuery(1, false);
  }, [appliedQ, tier, sort, categorySlug, fixedCategorySlug, runQuery, retryKey]);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedQ(draftQ);
    setPage(1);
  };

  const onLoadMore = () => {
    if (!hasMore || loadingMore) return;
    runQuery(page + 1, true);
  };

  return (
    <div className={className}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form onSubmit={onSubmitSearch} className="flex w-full max-w-xl flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search flags, tags, country…"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-[#009ab6] focus:ring-2 focus:ring-[#009ab6]/20"
              aria-label="Search catalog"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#009ab6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#007a8a]"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          {!fixedCategorySlug ? (
            <label className="flex flex-col text-xs font-medium text-gray-600">
              Category
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="mt-1 min-w-[10rem] rounded-lg border border-gray-200 bg-white py-2 pl-2 pr-8 text-sm text-gray-900"
              >
                <option value="">All categories</option>
                {categories
                  .filter((c) => c.isApproved)
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Type
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as TierFilter)}
              className="mt-1 rounded-lg border border-gray-200 bg-white py-2 pl-2 pr-8 text-sm text-gray-900"
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="pro">Pro / paid</option>
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="mt-1 rounded-lg border border-gray-200 bg-white py-2 pl-2 pr-8 text-sm text-gray-900"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A–Z</option>
              <option value="popular">Popular</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={freePreviewOnly}
              onChange={(e) => setFreePreviewOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#009ab6] focus:ring-[#009ab6]"
            />
            Free preview only
          </label>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        {loading && items.length === 0 ? 'Loading…' : `${total} result${total === 1 ? '' : 's'}`}
        {fixedCategorySlug ? (
          <>
            {' · '}
            <Link href="/browse" className="font-medium text-[#009ab6] hover:underline">
              Browse all
            </Link>
          </>
        ) : null}
      </p>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading catalog" />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <MarketplaceProductCard
                product={p}
                categoryName={categoryMap[p.categoryId] ?? 'Flags'}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:border-[#009ab6] hover:text-[#009ab6] disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
