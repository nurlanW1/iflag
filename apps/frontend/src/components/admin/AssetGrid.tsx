'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit, Eye, EyeOff, Trash2, MoreVertical } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface Asset {
  id: string;
  title: string;
  thumbnail_url?: string;
  status: 'draft' | 'published' | 'archived';
  is_premium: boolean;
  asset_type: string;
  download_count: number;
}

interface AssetGridProps {
  assets: Asset[];
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onDelete?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export default function AssetGrid({
  assets,
  onToggleStatus,
  onDelete,
  viewMode = 'grid',
}: AssetGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (viewMode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        {assets.map((asset) => (
          <div
            key={asset.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              backgroundColor: 'white',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-md)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={() => setHoveredId(asset.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: '80px',
                height: '50px',
                backgroundColor: 'var(--color-gray-100)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {asset.thumbnail_url ? (
                <img
                  src={asset.thumbnail_url}
                  alt={asset.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gray-400)',
                  fontSize: '0.75rem',
                }}>
                  No preview
                </div>
              )}
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                href={`/admin/assets/${asset.id}`}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-gray-900)',
                  textDecoration: 'none',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {asset.title}
              </Link>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--color-gray-500)',
                margin: 0,
                marginTop: '2px',
              }}>
                {asset.asset_type} • {asset.download_count} downloads
              </p>
            </div>

            {/* Status */}
            <StatusBadge status={asset.status} isPremium={asset.is_premium} size="sm" />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Link
                href={`/admin/assets/${asset.id}`}
                className="btn btn-sm btn-outline"
                title="Edit"
              >
                <Edit size={14} />
              </Link>
              {onToggleStatus && (
                <button
                  onClick={() => onToggleStatus(asset.id, asset.status)}
                  className="btn btn-sm btn-outline"
                  title={asset.status === 'published' ? 'Disable' : 'Enable'}
                >
                  {asset.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(asset.id)}
                  className="btn btn-sm btn-outline"
                  style={{ color: 'var(--color-error)' }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid View
  return (
    <div
      className="grid grid-cols-4"
      style={{
        gap: 'var(--spacing-lg)',
      }}
    >
      {assets.map((asset) => (
        <div
          key={asset.id}
          style={{
            backgroundColor: 'white',
            border: '1px solid var(--color-gray-200)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'all var(--transition-base)',
            transform: hoveredId === asset.id ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: hoveredId === asset.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
          }}
          onMouseEnter={() => setHoveredId(asset.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Thumbnail */}
          <Link href={`/admin/assets/${asset.id}`}>
            <div
              style={{
                width: '100%',
                aspectRatio: '16/10',
                backgroundColor: 'var(--color-gray-100)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {asset.thumbnail_url ? (
                <img
                  src={asset.thumbnail_url}
                  alt={asset.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform var(--transition-base)',
                    transform: hoveredId === asset.id ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gray-400)',
                }}>
                  No preview
                </div>
              )}

              {/* Overlay on Hover */}
              {hoveredId === asset.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-sm)',
                  }}
                >
                  <Link
                    href={`/admin/assets/${asset.id}`}
                    className="btn btn-sm"
                    style={{ backgroundColor: 'white', color: 'var(--color-gray-900)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                </div>
              )}

              {/* Status Badges */}
              <div
                style={{
                  position: 'absolute',
                  top: 'var(--spacing-xs)',
                  right: 'var(--spacing-xs)',
                }}
              >
                <StatusBadge status={asset.status} isPremium={asset.is_premium} size="sm" />
              </div>
            </div>
          </Link>

          {/* Content */}
          <div style={{ padding: 'var(--spacing-md)' }}>
            <Link
              href={`/admin/assets/${asset.id}`}
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-gray-900)',
                textDecoration: 'none',
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {asset.title}
            </Link>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--color-gray-500)',
              margin: 0,
            }}>
              {asset.download_count} downloads
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
