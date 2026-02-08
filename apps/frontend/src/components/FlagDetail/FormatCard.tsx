'use client';

import { Download, Crown, Check } from 'lucide-react';

interface FormatCardProps {
  format: {
    id: string;
    format_code: string;
    format_name: string;
    format_category: string;
  };
  asset: {
    id: string;
    width?: number;
    height?: number;
    quality_level?: string;
    file_size_bytes?: number;
  };
  price: {
    price_cents: number;
    requires_subscription: boolean;
  };
  hasAccess: boolean;
  isDownloading: boolean;
  onDownload: () => void;
}

export default function FormatCard({
  format,
  asset,
  price,
  hasAccess,
  isDownloading,
  onDownload,
}: FormatCardProps) {
  const formatIcons: Record<string, string> = {
    svg: '📐',
    eps: '📄',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    tiff: '🖼️',
    mp4: '🎬',
    webm: '🎬',
  };

  const formatIcon = formatIcons[format.format_code.toLowerCase()] || '📄';
  const isFree = price.price_cents === 0;
  const isPremium = price.requires_subscription;

  return (
    <div
      className="card"
      style={{
        padding: 'var(--spacing-lg)',
        textAlign: 'center',
        transition: 'all var(--transition-base)',
        cursor: hasAccess ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (hasAccess) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Format Icon & Name */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>
          {formatIcon}
        </div>
        <strong style={{ fontSize: '0.875rem', display: 'block' }}>
          {format.format_code.toUpperCase()}
        </strong>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', margin: 0 }}>
          {format.format_name}
        </p>
      </div>

      {/* Dimensions */}
      {asset.width && asset.height && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--color-gray-600)', 
          marginBottom: 'var(--spacing-sm)',
        }}>
          {asset.width} × {asset.height}px
        </div>
      )}

      {/* File Size */}
      {asset.file_size_bytes && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--color-gray-600)', 
          marginBottom: 'var(--spacing-md)',
        }}>
          {(asset.file_size_bytes / 1024 / 1024).toFixed(2)} MB
        </div>
      )}

      {/* Price */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        {isFree ? (
          <span className="badge badge-success" style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-md)' }}>
            Free
          </span>
        ) : (
          <div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: 'var(--color-primary)',
              marginBottom: 'var(--spacing-xs)',
            }}>
              ${(price.price_cents / 100).toFixed(2)}
            </div>
            {isPremium && (
              <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                <Crown size={12} style={{ marginRight: '4px' }} />
                Premium
              </span>
            )}
          </div>
        )}
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        disabled={isDownloading || (!hasAccess && isPremium)}
        className={`btn ${hasAccess ? 'btn-primary' : 'btn-secondary'}`}
        style={{ width: '100%' }}
      >
        {isDownloading ? (
          <>
            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
            Downloading...
          </>
        ) : hasAccess ? (
          <>
            <Download size={16} />
            Download
          </>
        ) : (
          <>
            <Crown size={16} />
            Premium Required
          </>
        )}
      </button>

      {/* Access Indicator */}
      {hasAccess && isPremium && (
        <div style={{ 
          marginTop: 'var(--spacing-sm)',
          fontSize: '0.75rem',
          color: 'var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}>
          <Check size={14} />
          Included in Premium
        </div>
      )}
    </div>
  );
}
