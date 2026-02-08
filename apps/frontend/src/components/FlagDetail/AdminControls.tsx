'use client';

import { useState } from 'react';
import { Edit, DollarSign, Eye, EyeOff, BarChart3, Save, X } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface AdminControlsProps {
  asset: any;
  onUpdate: () => void;
}

export default function AdminControls({ asset, onUpdate }: AdminControlsProps) {
  const [editMode, setEditMode] = useState<'metadata' | 'pricing' | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: asset.title,
    description: asset.description,
  });

  const handleToggleStatus = async () => {
    try {
      await adminApi.toggleAssetStatus(asset.id, asset.status !== 'published');
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleSaveMetadata = async () => {
    setSaving(true);
    try {
      await adminApi.updateAsset(asset.id, formData);
      setEditMode(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getAssetStats(asset.id);
      setStats(data);
      setShowStats(true);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div>
      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
        <button
          onClick={() => setEditMode(editMode === 'metadata' ? null : 'metadata')}
          className={`btn btn-sm ${editMode === 'metadata' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Edit size={14} />
          Edit Metadata
        </button>
        <button
          onClick={() => setEditMode(editMode === 'pricing' ? null : 'pricing')}
          className={`btn btn-sm ${editMode === 'pricing' ? 'btn-primary' : 'btn-outline'}`}
        >
          <DollarSign size={14} />
          Manage Pricing
        </button>
        <button
          onClick={handleToggleStatus}
          className="btn btn-sm btn-outline"
        >
          {asset.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
          {asset.status === 'published' ? 'Disable' : 'Enable'}
        </button>
        <button
          onClick={loadStats}
          className="btn btn-sm btn-outline"
        >
          <BarChart3 size={14} />
          View Stats
        </button>
      </div>

      {/* Edit Metadata Panel */}
      {editMode === 'metadata' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Edit Metadata</h3>
            <button
              onClick={() => setEditMode(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditMode(null)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleSaveMetadata} className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Management Panel */}
      {editMode === 'pricing' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Manage Pricing</h3>
            <button
              onClick={() => setEditMode(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
              Set pricing for each format. Leave empty for free formats.
            </p>
            {/* Pricing form would go here */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditMode(null)} className="btn btn-outline">
                Cancel
              </button>
              <button className="btn btn-primary">
                <Save size={16} />
                Save Prices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && stats && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Download Statistics</h3>
              <button
                onClick={() => setShowStats(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>Total Downloads</p>
                  <p style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>{stats.total_downloads}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>Unique Users</p>
                  <p style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>{stats.unique_users}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>Premium Downloads</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--color-success)' }}>
                    {stats.premium_downloads}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: 0 }}>Free Downloads</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                    {stats.free_downloads}
                  </p>
                </div>
              </div>

              {stats.daily_stats && stats.daily_stats.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>Last 30 Days</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    {stats.daily_stats.map((day: any, index: number) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: 'var(--spacing-xs)',
                        backgroundColor: 'var(--color-gray-50)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        <span style={{ fontSize: '0.875rem' }}>
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {day.count} downloads
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
