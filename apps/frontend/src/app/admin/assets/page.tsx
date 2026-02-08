'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, Eye, EyeOff, Download, Filter } from 'lucide-react';

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    asset_type: '',
    status: '',
    is_premium: '',
  });

  useEffect(() => {
    loadAssets();
  }, [page, filters]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { adminApi } = await import('@/lib/admin-api');
      const data = await adminApi.getAssets({
        page: page.toString(),
        limit: '50',
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
    if (!confirm('Are you sure you want to archive this asset?')) {
      return;
    }

    try {
      const { adminApi } = await import('@/lib/admin-api');
      await adminApi.deleteAsset(assetId);
      loadAssets();
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>
            Manage Assets
          </h1>
          <p style={{ color: 'var(--color-gray-600)' }}>
            {total} total assets
          </p>
        </div>
        <Link href="/admin/upload" className="btn btn-primary">
          Upload New Asset
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card-body">
          <div className="grid grid-cols-4" style={{ gap: 'var(--spacing-md)' }}>
            <div>
              <label className="form-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: 'var(--spacing-sm)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-gray-400)',
                }} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="form-input"
                  placeholder="Search assets..."
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Type</label>
              <select
                value={filters.asset_type}
                onChange={(e) => setFilters({ ...filters, asset_type: e.target.value })}
                className="form-select"
              >
                <option value="">All Types</option>
                <option value="flag">Flag</option>
                <option value="emblem">Emblem</option>
                <option value="coat_of_arms">Coat of Arms</option>
                <option value="symbol">Symbol</option>
                <option value="video">Video</option>
                <option value="animated">Animated</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="form-label">Pricing</label>
              <select
                value={filters.is_premium}
                onChange={(e) => setFilters({ ...filters, is_premium: e.target.value })}
                className="form-select"
              >
                <option value="">All</option>
                <option value="true">Premium</option>
                <option value="false">Free</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-gray-200)', backgroundColor: 'var(--color-gray-50)' }}>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Pricing</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Downloads</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Created</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <div>
                          <strong>{asset.title}</strong>
                          {asset.description && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>
                              {asset.description.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <span className="badge">{asset.asset_type}</span>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <span className={`badge ${
                          asset.status === 'published' ? 'badge-success' : 
                          asset.status === 'archived' ? 'badge-error' : ''
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        {asset.is_premium ? (
                          <span className="badge badge-warning">Premium</span>
                        ) : (
                          <span className="badge">Free</span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        {asset.download_count || 0}
                      </td>
                      <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-gray-600)' }}>
                        {new Date(asset.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/admin/assets/${asset.id}`}
                            className="btn btn-sm btn-outline"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => toggleStatus(asset.id, asset.status)}
                            className="btn btn-sm btn-outline"
                            title={asset.status === 'published' ? 'Disable' : 'Enable'}
                          >
                            {asset.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => deleteAsset(asset.id)}
                            className="btn btn-sm btn-outline"
                            style={{ color: 'var(--color-error)' }}
                            title="Archive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && assets.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--color-gray-500)' }}>
              No assets found. <Link href="/admin/upload">Upload your first asset</Link>
            </div>
          )}

          {/* Pagination */}
          {total > 50 && (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline"
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 var(--spacing-md)' }}>
                Page {page} of {Math.ceil(total / 50)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 50)}
                className="btn btn-outline"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
