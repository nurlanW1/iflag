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

function tierFromSearchParam(raw: string | null): TierFilter {
  if (raw === 'pro' || raw === 'free') return raw;
  return 'all';
}

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
  url.searchParams.delete('hasFreeDownload');
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
  const [tier, setTier] = useState<TierFilter>(() => tierFromSearchParam(searchParams.get('tier')));
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get('sort') as SortKey) || 'newest'
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
    [appliedQ, tier, sort, categorySlug, fixedCategorySlug, syncUrl]
  );

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, [retryKey]);

  /** Filters / search (applied) change → first page */
  useEffect(() => {
    runQuery(1, false);
  }, [appliedQ, tier, sort, categorySlug, fixedCategorySlug, runQuery, retryKey]);

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
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
        if (slug && !cancelled) {
          window.location.replace(`/gallery/${encodeURIComponent(slug)}`);
        }
      } catch {
        /* stay on category catalog */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = draftQ.trim();
    if (!q) {
      setAppliedQ('');
      setPage(1);
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/gallery/resolve-country?q=${encodeURIComponent(q)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json()) as { slug?: string | null };
          const slug = data.slug?.trim();
          if (slug) {
            window.location.href = `/gallery/${encodeURIComponent(slug)}`;
            return;
          }
        }
      } catch {
        /* product catalog search */
      }
      setAppliedQ(q);
      setPage(1);
    })();
  };

  const onLoadMore = () => {
    if (!hasMore || loadingMore) return;
    runQuery(page + 1, true);
  };

  return (
    <div className={['min-w-0', className].filter(Boolean).join(' ') || 'min-w-0'}>
      <div className="mb-6 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm sm:p-5">
        <form onSubmit={onSubmitSearch} className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Search</span>
            <div className="relative flex min-h-11 items-center">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <input
                type="search"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Country, design name, tag…"
                className="min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2 pl-10 pr-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-[var(--brand-blue)] focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
                aria-label="Search catalog"
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:shrink-0 lg:gap-3">
            {!fixedCategorySlug ? (
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Category
                </span>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="min-h-11 w-full min-w-[8.5rem] rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                >
                  <option value="">All</option>
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
            <label className="flex min-w-0 flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Access</span>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as TierFilter)}
                className="min-h-11 w-full min-w-[7.5rem] rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              >
                <option value="all">All tiers</option>
                <option value="free">Free only</option>
                <option value="pro">Paid only</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-11 w-full min-w-[7.5rem] rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title A–Z</option>
                <option value="popular">Popular</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-blue-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] lg:mb-0"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
        <p>
          {loading && items.length === 0 ? (
            'Loading…'
          ) : (
            <>
              <span className="font-semibold text-stone-900">{total}</span> result{total === 1 ? '' : 's'}
              {tier === 'free' ? ' · free downloads' : tier === 'pro' ? ' · paid stock' : null}
            </>
          )}
        </p>
        {fixedCategorySlug ? (
          <Link href="/gallery" className="font-semibold text-[var(--brand-blue)] hover:underline">
            View gallery
          </Link>
        ) : null}
      </div>

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
            className="min-h-12 w-full max-w-xl rounded-xl border border-neutral-200 bg-white px-8 py-3.5 text-sm font-semibold text-[#2a2a2a] shadow-sm transition hover:border-[var(--brand-blue)]/40 hover:bg-[var(--brand-blue-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50 sm:w-auto md:max-w-none"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
