'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import type { Category } from '@/types/marketplace';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';
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
    <div className={['min-w-0', className].filter(Boolean).join(' ') || 'min-w-0'}>
      <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between lg:gap-12">
        <form
          onSubmit={onSubmitSearch}
          className="flex min-w-0 w-full flex-1 flex-col gap-3 sm:max-w-4xl lg:flex-row lg:items-stretch lg:gap-3"
        >
          <div className="relative min-h-12 flex-1 sm:min-h-14">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 sm:left-5 sm:h-6 sm:w-6" />
            <input
              type="search"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search flags, tags, country…"
              className="h-12 w-full min-h-12 rounded-2xl border border-gray-200 py-3 pl-12 pr-4 text-base text-gray-900 shadow-sm outline-none transition-shadow placeholder:text-gray-400 focus:border-[#009ab6] focus:ring-2 focus:ring-[#009ab6]/25 sm:h-14 sm:min-h-[3.5rem] sm:py-3.5 sm:pl-14 sm:pr-5 sm:text-[1.05rem]"
              aria-label="Search catalog"
            />
          </div>
          <button
            type="submit"
            className="h-12 min-h-12 shrink-0 rounded-2xl bg-[#009ab6] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#007a8a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009ab6] sm:h-auto sm:self-stretch sm:px-10"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-x-4 gap-y-4 lg:justify-end">
          {!fixedCategorySlug ? (
            <label className="flex min-w-[10.5rem] flex-col gap-2 text-sm font-semibold tracking-tight text-gray-700">
              Category
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-9 text-base text-gray-900 shadow-sm focus:border-[#009ab6] focus:outline-none focus:ring-2 focus:ring-[#009ab6]/20"
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
          <label className="flex min-w-[7.75rem] flex-col gap-2 text-sm font-semibold tracking-tight text-gray-700">
            Type
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as TierFilter)}
              className="rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-9 text-base text-gray-900 shadow-sm focus:border-[#009ab6] focus:outline-none focus:ring-2 focus:ring-[#009ab6]/20"
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="pro">Pro / paid</option>
            </select>
          </label>
          <label className="flex min-w-[8.75rem] flex-col gap-2 text-sm font-semibold tracking-tight text-gray-700">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-9 text-base text-gray-900 shadow-sm focus:border-[#009ab6] focus:outline-none focus:ring-2 focus:ring-[#009ab6]/20"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A–Z</option>
              <option value="popular">Popular</option>
            </select>
          </label>
          <label className="flex min-h-[3.25rem] items-center gap-2.5 self-end text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={freePreviewOnly}
              onChange={(e) => setFreePreviewOnly(e.target.checked)}
              className="h-[1.125rem] w-[1.125rem] rounded border-gray-300 text-[#009ab6] focus:ring-[#009ab6]"
            />
            Free preview only
          </label>
        </div>
      </div>

      <p className="mb-4 text-base text-gray-600">
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
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-50"
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
        <ul className={marketplaceProductCardGridClasses}>
          {items.map((p) => (
            <li key={p.id} className="min-h-0">
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
            className="rounded-xl border-2 border-gray-200 bg-white px-10 py-3.5 text-base font-semibold text-gray-900 transition hover:border-[#009ab6] hover:text-[#009ab6] disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
