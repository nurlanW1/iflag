'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { Search, Plus, Edit, Trash2, Globe, Filter, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Country {
  id: string;
  name: string;
  slug: string;
  iso_alpha_2: string | null;
  iso_alpha_3: string | null;
  region: string | null;
  category: string;
  status: 'draft' | 'published' | 'archived';
  flag_count: number;
  published_flag_count: number;
  created_at: string;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCountries();
  }, [page, searchQuery, regionFilter, statusFilter, categoryFilter]);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page,
        limit,
      };
      if (searchQuery) filters.search = searchQuery;
      if (regionFilter) filters.region = regionFilter;
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;

      const result = await adminApi.getCountries(filters);
      setCountries(result.countries || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"? This will hide it from the public gallery.`)) {
      return;
    }

    try {
      await adminApi.deleteCountry(id);
      loadCountries();
    } catch (error: any) {
      alert(error.message || 'Failed to delete country');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRegionFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const activeFiltersCount = [regionFilter, statusFilter, categoryFilter].filter(Boolean).length;

  const regions = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'];
  const categories = ['country', 'autonomy', 'organization', 'historical'];
  const statuses = ['draft', 'published', 'archived'];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-[#009ab6] to-[#006d7a] bg-clip-text text-transparent">
              Countries Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage {total} countries and their flag assets
            </p>
          </div>
          <Link
            href="/admin/countries/new"
            className="flex items-center gap-2 bg-gradient-to-r from-[#009ab6] to-[#007a8a] hover:from-[#007a8a] hover:to-[#006d7a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#009ab6]/20 hover:shadow-xl hover:shadow-[#009ab6]/30 transition-all duration-200"
          >
            <Plus size={20} />
            New Country
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search countries by name, ISO code, or region..."
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 hover:text-[#009ab6] font-medium transition-colors"
          >
            <Filter size={18} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-[#009ab6] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-[#009ab6] font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Region Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
                    <select
                      value={regionFilter}
                      onChange={(e) => {
                        setRegionFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#009ab6] focus:ring-2 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                    >
                      <option value="">All Regions</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#009ab6] focus:ring-2 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#009ab6] focus:ring-2 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                    >
                      <option value="">All Status</option>
                      {statuses.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Countries Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009ab6]"></div>
        </div>
      ) : countries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl"
        >
          <Globe size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No countries found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || activeFiltersCount > 0 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first country'}
          </p>
          <Link
            href="/admin/countries/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#009ab6] to-[#007a8a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#009ab6]/20 hover:shadow-xl transition-all"
          >
            <Plus size={20} />
            Create First Country
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Country</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">ISO Codes</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Region</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Flags</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {countries.map((country, idx) => (
                    <motion.tr
                      key={country.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{country.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{country.slug}</div>
                      </td>
                      <td className="py-4 px-6">
                        {country.iso_alpha_2 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {country.iso_alpha_2}
                            </span>
                            {country.iso_alpha_3 && (
                              <span className="font-mono text-xs text-gray-500">
                                ({country.iso_alpha_3})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {country.region ? (
                          <span className="text-gray-700 font-medium">{country.region}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {country.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{country.published_flag_count}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-600">{country.flag_count}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          country.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : country.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {country.status === 'published' ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          {country.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/countries/${country.id}`}
                            className="p-2 text-[#009ab6] hover:bg-[#009ab6]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(country.id, country.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Archive"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Pagination */}
          {total > limit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center justify-between"
            >
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-semibold">{total}</span> countries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#009ab6] hover:bg-[#009ab6]/5 transition-all font-semibold text-gray-700 disabled:text-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#009ab6] hover:bg-[#009ab6]/5 transition-all font-semibold text-gray-700 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
