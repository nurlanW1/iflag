'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Download, BarChart3 } from 'lucide-react';

export default function AdminAssetEditPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    country_code: '',
    organization_name: '',
    is_premium: false,
    status: 'draft',
    tags: '',
    style: '',
  });

  useEffect(() => {
    loadAsset();
    loadCategories();
  }, [params.id]);

  const loadAsset = async () => {
    try {
      const { adminApi } = await import('@/lib/admin-api');
      const data = await adminApi.getAsset(params.id as string);
      setAsset(data);
      
      // Populate form
      setFormData({
        title: data.title || '',
        description: data.description || '',
        category_id: data.category_id || '',
        country_code: data.country_code || '',
        organization_name: data.organization_name || '',
        is_premium: data.is_premium || false,
        status: data.status || 'draft',
        tags: data.tags?.map((t: any) => t.name).join(', ') || '',
        style: data.files?.[0]?.metadata?.style || '',
      });
    } catch (error) {
      console.error('Failed to load asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { adminApi } = await import('@/lib/admin-api');
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { adminApi } = await import('@/lib/admin-api');
      const data = await adminApi.getAssetStats(params.id as string);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { adminApi } = await import('@/lib/admin-api');
      await adminApi.updateAsset(params.id as string, formData);
      router.push('/admin/assets');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  if (!asset) {
    return <div>Asset not found</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <Link href="/admin/assets" className="btn btn-sm btn-outline" style={{ marginBottom: 'var(--spacing-md)' }}>
            <ArrowLeft size={18} />
            Back to Assets
          </Link>
          <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>
            Edit Asset
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            onClick={loadStats}
            className="btn btn-outline"
          >
            <BarChart3 size={18} />
            View Stats
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-lg)' }}>
        {/* Form */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Asset Information</h3>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Country Code</label>
                  <input
                    type="text"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                    className="form-input"
                    maxLength={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Organization</label>
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Style</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select style...</option>
                  <option value="flat">Flat</option>
                  <option value="waving">Waving</option>
                  <option value="icon">Icon</option>
                  <option value="round">Round</option>
                  <option value="heart">Heart Shape</option>
                  <option value="mockup">Mockup</option>
                  <option value="fx">FX / Stylized</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="form-input"
                  placeholder="Comma-separated tags"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                  />
                  Premium Asset
                </label>
              </div>
            </div>
          </div>

          {/* Files */}
          {asset.files && asset.files.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <div className="card-header">
                <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Files ({asset.files.length})</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {asset.files.map((file: any) => (
                    <div key={file.id} style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--color-gray-50)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <strong>{file.format.toUpperCase()}</strong>
                        {file.variant !== 'original' && <span className="badge" style={{ marginLeft: 'var(--spacing-xs)' }}>{file.variant}</span>}
                        {file.size && <span className="badge" style={{ marginLeft: 'var(--spacing-xs)' }}>{file.size}</span>}
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 'var(--spacing-xs) 0 0 0' }}>
                          {(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Sidebar */}
        <div>
          {stats && (
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div className="card-header">
                <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Download Statistics</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>Total Downloads</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{stats.total_downloads}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>Premium Downloads</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{stats.premium_downloads}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>Free Downloads</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{stats.free_downloads}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Asset Preview</h3>
            </div>
            <div className="card-body">
              {asset.thumbnail_url ? (
                <img
                  src={asset.thumbnail_url}
                  alt={asset.title}
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  aspectRatio: '16/10',
                  backgroundColor: 'var(--color-gray-100)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gray-400)',
                }}>
                  No preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
