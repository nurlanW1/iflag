'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, Filter, Crown, X, SlidersHorizontal, Grid3x3, List } from 'lucide-react';
import AssetCard from '@/components/AssetCard';
import { motion } from 'framer-motion';

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
      const data = await api.searchAssets({
        ...filters,
        page,
        limit: 24,
      });
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
    setFilters({
      search: '',
      asset_type: [],
      is_premium: undefined,
      sort: 'newest',
    });
    setPage(1);
  };

  const activeFiltersCount = filters.asset_type.length + (filters.is_premium !== undefined ? 1 : 0);

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-5xl font-black mb-4 text-black">Browse Flags</h1>
          <p className="text-black/60 text-lg">Discover high-quality flags from around the world</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/40" size={20} />
              <input
                type="text"
                placeholder="Search flags, countries, organizations..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-white border border-black/10 rounded-lg text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#009ab6] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-[#009ab6] hover:bg-[#007a8a] text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Search size={20} />
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-4 rounded-lg font-semibold transition-colors flex items-center gap-2 border ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-[#009ab6] text-white border-[#009ab6]'
                  : 'bg-white text-black hover:bg-black/5 border-black/10'
              }`}
            >
              <SlidersHorizontal size={20} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-[#009ab6] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg p-6 mb-6 border border-black/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-black">
                <Filter size={20} />
                Filters
              </h3>
              <div className="flex items-center gap-4">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[#009ab6] hover:text-[#007a8a] text-sm font-semibold"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-black/40 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Asset Type */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-black/70">Asset Type</label>
                <div className="flex flex-wrap gap-2">
                  {['flag', 'symbol', 'video', 'animated', 'coat_of_arms', 'emblem'].map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleAssetType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.asset_type.includes(type)
                          ? 'bg-[#009ab6] text-white'
                          : 'bg-black/5 text-black/70 hover:bg-black/10'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Premium Filter */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-black/70">Access Level</label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, is_premium: filters.is_premium === true ? undefined : true })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2 ${
                      filters.is_premium === true
                        ? 'bg-[#009ab6] text-white'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                    }`}
                  >
                    <Crown size={16} />
                    Premium Only
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, is_premium: filters.is_premium === false ? undefined : false })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      filters.is_premium === false
                        ? 'bg-black text-white'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                    }`}
                  >
                    Free Only
                  </button>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-black/70">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white border border-black/10 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#009ab6]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-black/60">
              <span className="text-black font-semibold">{total.toLocaleString()}</span> {total === 1 ? 'asset' : 'assets'} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#009ab6] text-white' : 'bg-black/5 text-black/70 hover:bg-black/10'
              }`}
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-[#009ab6] text-white' : 'bg-black/5 text-black/70 hover:bg-black/10'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009ab6]"></div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {assets.map((asset, idx) => (
                  <AssetCard key={asset.id} asset={asset} index={idx} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {assets.map((asset, idx) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="bg-white rounded-lg p-4 hover:bg-black/5 transition-colors border border-black/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-16 bg-black/5 rounded flex-shrink-0">
                        {asset.thumbnail_url && (
                          <img
                            src={asset.thumbnail_url}
                            alt={asset.title}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-1">{asset.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-black/60">
                          <span className="uppercase">{asset.asset_type || 'Flag'}</span>
                          {asset.is_premium && (
                            <span className="flex items-center gap-1 text-[#009ab6]">
                              <Crown size={14} />
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > 24 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-3 bg-black/5 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-black"
                >
                  Previous
                </button>
                <span className="text-black/60">
                  Page <span className="text-black font-semibold">{page}</span> of{' '}
                  <span className="text-black font-semibold">{Math.ceil(total / 24)}</span>
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 24)}
                  className="px-6 py-3 bg-black/5 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-black"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {!loading && assets.length === 0 && (
          <div className="text-center py-20">
            <p className="text-black/60 text-lg mb-4">No assets found</p>
            <p className="text-black/40">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </main>
  );
}
