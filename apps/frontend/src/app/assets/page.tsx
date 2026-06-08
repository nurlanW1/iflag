'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Search,
  Crown,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Rows3,
  FileImage,
  Sparkles,
} from 'lucide-react';
import AssetCard from '@/components/AssetCard';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { shouldWatermarkFlagPreview } from '@/lib/gallery/flag-preview-watermark';
import { motion } from 'framer-motion';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';

function SkeletonGrid() {
  return (
    <div className={marketplaceProductCardGridClasses}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
          <div className="aspect-[4/3] w-full animate-pulse bg-stone-100" />
          <div className="space-y-2 px-4 py-3">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-stone-100" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-stone-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    asset_type: [] as string[],
    is_premium: undefined as boolean | undefined,
    sort: 'newest' as 'newest' | 'oldest' | 'popular' | 'title',
  });

  useEffect(() => {
    loadAssets();
  }, [page, filters]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await api.searchAssets({ ...filters, page, limit: 24 });
      setAssets(data.assets || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAssets();
  };

  const toggleAssetType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      asset_type: prev.asset_type.includes(type)
        ? prev.asset_type.filter((t) => t !== type)
        : [...prev.asset_type, type],
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', asset_type: [], is_premium: undefined, sort: 'newest' });
    setPage(1);
  };

  const activeFiltersCount =
    filters.asset_type.length + (filters.is_premium !== undefined ? 1 : 0);

  const totalPages = Math.ceil(total / 24);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200/80 bg-gradient-to-br from-[#0a3b44] via-[#0d4c5b] to-[#0a3b44]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background:
              'radial-gradient(circle at 18% 30%, #60a5fa 0%, transparent 38%), radial-gradient(circle at 82% 70%, #2563eb 0%, transparent 42%)',
          }}
        />
        <div className="marketplace-shell relative pb-10 pt-10 sm:pb-14 sm:pt-12 md:pb-16 md:pt-14">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
            <Sparkles size={13} className="text-[#7adcef]" aria-hidden />
            Asset library
          </div>
          <h1 className="mt-3 max-w-2xl text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            Browse all flag assets
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Vectors, rasters, animations, and archives — filter by type, format, or access level.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/75">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-white/15 backdrop-blur">
              <FileImage size={13} aria-hidden /> {total > 0 ? `${total.toLocaleString()} assets` : 'All assets'}
            </span>
          </div>
        </div>
      </section>

      {/* Sticky search/filter bar */}
      <div className="sticky top-0 z-30 -mt-5 border-b border-stone-200/60 bg-stone-50/92 backdrop-blur-md">
        <div className="marketplace-shell py-4">
          <div className="rounded-2xl border border-stone-200/85 bg-white/98 px-3 py-3 shadow-[0_6px_24px_-12px_rgba(15,23,42,0.12)] ring-1 ring-stone-100/90 sm:px-4">
            <div className="flex items-center gap-2">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative min-h-11 flex-1 min-w-0">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={17}
                  aria-hidden
                />
                <input
                  type="text"
                  placeholder="Search assets, countries, types…"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50/90 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 transition-all focus:border-[var(--brand-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </form>

              {/* Filters toggle */}
              <button
                type="button"
                onClick={() => setShowFilters((o) => !o)}
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white'
                    : 'border-stone-200 bg-stone-50/90 text-stone-800 hover:bg-stone-100'
                }`}
              >
                <SlidersHorizontal size={16} aria-hidden />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative hidden sm:block">
                <select
                  value={filters.sort}
                  onChange={(e) => {
                    setFilters({ ...filters, sort: e.target.value as any });
                    setPage(1);
                  }}
                  aria-label="Sort assets"
                  className="h-11 appearance-none rounded-xl border border-stone-200 bg-stone-50/90 pl-3 pr-8 text-xs font-semibold text-stone-800 transition-all focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 md:min-w-[9rem]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="popular">Most popular</option>
                  <option value="title">Title A–Z</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden>▾</span>
              </div>

              {/* View toggle */}
              <div className="flex shrink-0 items-center rounded-xl bg-stone-100/90 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                  className={`flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <LayoutGrid size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  className={`flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Rows3 size={16} aria-hidden />
                </button>
              </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 border-t border-stone-100 pt-3"
              >
                <div className="flex flex-wrap items-start gap-4">
                  {/* Asset type */}
                  <div className="min-w-0">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-stone-500">Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['flag', 'symbol', 'video', 'animated', 'coat_of_arms', 'emblem'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleAssetType(type)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                            filters.asset_type.includes(type)
                              ? 'bg-[var(--brand-blue)] text-white shadow-sm shadow-[#2563eb]/30'
                              : 'bg-stone-100/80 text-stone-700 hover:bg-stone-200/80'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px w-full bg-stone-100 sm:hidden" />

                  {/* Premium toggle */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-stone-500">Access</p>
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          is_premium: filters.is_premium === true ? undefined : true,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        filters.is_premium === true
                          ? 'bg-amber-400/95 text-amber-950 ring-1 ring-amber-600/30'
                          : 'bg-stone-100/80 text-stone-700 hover:bg-stone-200/80'
                      }`}
                    >
                      <Crown size={12} aria-hidden />
                      Premium only
                    </button>
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="ml-auto flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50"
                    >
                      <X size={12} aria-hidden />
                      Clear filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="marketplace-shell py-7 sm:py-10 lg:py-12">
        {/* Results count */}
        <div className="mb-5">
          <p className="text-xs font-medium text-stone-500 sm:text-sm">
            {loading ? 'Loading assets…' : (
              <>
                <span className="font-semibold text-stone-900">{total.toLocaleString()}</span>{' '}
                {total === 1 ? 'asset' : 'assets'}
                {filters.search ? (
                  <> for <span className="font-semibold text-stone-900">"{filters.search}"</span></>
                ) : null}
              </>
            )}
          </p>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : assets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
              <Search size={22} aria-hidden />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-stone-900">No assets found</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
              Try adjusting your filters or search terms.
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-blue-hover)]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className={`${marketplaceProductCardGridClasses} mb-8`}>
            {assets.map((asset, idx) => (
              <div key={asset.id} className="min-h-0">
                <AssetCard asset={asset} index={idx} />
              </div>
            ))}
          </div>
        ) : (
          <ul className="mb-8 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
            {assets.map((asset) => (
              <li key={asset.id}>
                <div className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-stone-50">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-50 ring-1 ring-stone-200">
                    {asset.thumbnail_url && (
                      <ProductPreviewImage
                        className="absolute inset-0"
                        watermarkEnabled={shouldWatermarkFlagPreview({
                          isPremiumDesign: Boolean(asset.is_premium),
                        })}
                        protectEnabled
                      >
                        <img
                          src={asset.thumbnail_url}
                          alt={asset.title}
                          draggable={false}
                          className="h-full w-full object-contain p-1"
                        />
                      </ProductPreviewImage>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">{asset.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                      <span className="uppercase">{asset.asset_type || 'Flag'}</span>
                      {asset.is_premium && (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Crown size={11} aria-hidden />
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-stone-500">
              Page <span className="font-semibold text-stone-900">{page}</span> of{' '}
              <span className="font-semibold text-stone-900">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
