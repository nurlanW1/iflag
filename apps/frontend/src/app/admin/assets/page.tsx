'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckSquare,
  Square,
} from 'lucide-react';

const PAGE_SIZE = 20;

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    asset_type: '',
    status: '',
    is_premium: '',
  });

  useEffect(() => {
    loadAssets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const loadAssets = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const { adminApi } = await import('@/lib/admin-api');
      const data = await adminApi.getAssets({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        ...filters,
      });
      setAssets(data.assets || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (assetId: string, currentStatus: string) => {
    try {
      const { adminApi } = await import('@/lib/admin-api');
      await adminApi.toggleAssetStatus(assetId, currentStatus !== 'published');
      loadAssets();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to archive this asset?')) return;
    try {
      const { adminApi } = await import('@/lib/admin-api');
      await adminApi.deleteAsset(assetId);
      loadAssets();
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const allSelected = assets.length > 0 && assets.every((a) => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkPublish = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const { adminApi } = await import('@/lib/admin-api');
      await Promise.all([...selectedIds].map((id) => adminApi.toggleAssetStatus(id, true)));
      setSelectedIds(new Set());
      loadAssets();
    } catch (error) {
      console.error('Bulk publish failed:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0 || !confirm(`Archive ${selectedIds.size} selected assets?`)) return;
    setBulkLoading(true);
    try {
      const { adminApi } = await import('@/lib/admin-api');
      await Promise.all([...selectedIds].map((id) => adminApi.deleteAsset(id)));
      setSelectedIds(new Set());
      loadAssets();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#2a2a2a]">Asset Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total assets</p>
        </div>
        <Link
          href="/admin/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
        >
          <Plus size={16} aria-hidden />
          Upload New
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
              aria-hidden
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              placeholder="Search assets…"
              className="h-10 w-full rounded-xl border border-neutral-200 bg-gray-50/80 pl-9 pr-3 text-sm text-[#2a2a2a] placeholder:text-gray-400 focus:border-[var(--brand-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>
          <select
            value={filters.asset_type}
            onChange={(e) => { setFilters({ ...filters, asset_type: e.target.value }); setPage(1); }}
            className="h-10 rounded-xl border border-neutral-200 bg-gray-50/80 px-3 text-sm font-medium text-gray-700 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          >
            <option value="">All Types</option>
            <option value="flag">Flag</option>
            <option value="emblem">Emblem</option>
            <option value="coat_of_arms">Coat of Arms</option>
            <option value="symbol">Symbol</option>
            <option value="video">Video</option>
            <option value="animated">Animated</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            className="h-10 rounded-xl border border-neutral-200 bg-gray-50/80 px-3 text-sm font-medium text-gray-700 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={filters.is_premium}
            onChange={(e) => { setFilters({ ...filters, is_premium: e.target.value }); setPage(1); }}
            className="h-10 rounded-xl border border-neutral-200 bg-gray-50/80 px-3 text-sm font-medium text-gray-700 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          >
            <option value="">All Pricing</option>
            <option value="true">Premium</option>
            <option value="false">Free</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-blue-700">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={bulkPublish}
            disabled={bulkLoading}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Publish selected
          </button>
          <button
            type="button"
            onClick={bulkDelete}
            disabled={bulkLoading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs font-medium text-blue-600 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-neutral-200 border-t-[#2563eb]" aria-hidden />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center">
            <Flag className="mx-auto mb-3 text-gray-300" size={40} aria-hidden />
            <p className="text-sm font-medium text-gray-500">No assets found</p>
            <Link
              href="/admin/upload"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
            >
              <Plus size={14} /> Upload first asset
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-neutral-200/80 bg-gray-50/60">
                  <th className="w-10 py-3 pl-4 pr-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      aria-label={allSelected ? 'Deselect all' : 'Select all'}
                      className="flex items-center text-gray-400 hover:text-[var(--brand-blue)]"
                    >
                      {allSelected
                        ? <CheckSquare size={16} className="text-[var(--brand-blue)]" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  <th className="w-14 py-3 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Thumb
                  </th>
                  <th className="py-3 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Country / Title
                  </th>
                  <th className="py-3 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="py-3 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Format
                  </th>
                  <th className="py-3 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                  <th className="py-3 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="py-3 pr-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => {
                  const checked = selectedIds.has(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className={`transition-colors hover:bg-gray-50/60 ${checked ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-3 pl-4 pr-2">
                        <button
                          type="button"
                          onClick={() => toggleSelect(asset.id)}
                          aria-label={checked ? 'Deselect' : 'Select'}
                          className="flex items-center text-gray-400 hover:text-[var(--brand-blue)]"
                        >
                          {checked
                            ? <CheckSquare size={16} className="text-[var(--brand-blue)]" />
                            : <Square size={16} />}
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="h-9 w-12 overflow-hidden rounded-md bg-gray-100">
                          {asset.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={asset.thumbnail_url}
                              alt=""
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <Flag size={14} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[180px] py-3 pr-4">
                        <p className="truncate text-sm font-semibold text-[#2a2a2a]">{asset.title}</p>
                        {asset.description && (
                          <p className="truncate text-xs text-gray-400">
                            {asset.description.substring(0, 40)}…
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-gray-600">
                          {asset.asset_type || '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-500">
                        {asset.formats?.join(', ') || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {asset.is_premium ? (
                          <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                            ${asset.price_cents ? Math.ceil(asset.price_cents / 100) : '?'}
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(asset.id, asset.status)}
                          title={asset.status === 'published' ? 'Click to unpublish' : 'Click to publish'}
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition hover:opacity-80 ${
                            asset.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : asset.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {asset.status === 'published' ? 'Published' : asset.status === 'draft' ? 'Draft' : asset.status}
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/assets/${asset.id}`}
                            title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Edit size={14} aria-hidden />
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleStatus(asset.id, asset.status)}
                            title={asset.status === 'published' ? 'Unpublish' : 'Publish'}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100 ${
                              asset.status === 'published'
                                ? 'text-green-500 hover:text-gray-600'
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                          >
                            {asset.status === 'published'
                              ? <EyeOff size={14} aria-hidden />
                              : <Eye size={14} aria-hidden />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAsset(asset.id)}
                            title="Archive"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
              <span className="font-semibold text-gray-700">{totalPages}</span> · {total} total
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} aria-hidden />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                      p === page
                        ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white'
                        : 'border-neutral-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
