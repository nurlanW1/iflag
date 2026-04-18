'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Crown, ArrowLeft, Check } from 'lucide-react';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    loadAsset();
    checkPremium();
  }, [params.slug]);

  const loadAsset = async () => {
    try {
      const data = await api.getAssetBySlug(params.slug as string);
      setAsset(data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        router.push('/assets');
      }
      console.error('Failed to load asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPremium = async () => {
    if (user) {
      try {
        const data = await api.checkPremium();
        setHasPremium(data.hasPremium);
      } catch (error) {
        console.error('Failed to check premium:', error);
      }
    }
  };

  const handleDownload = async () => {
    if (!asset) return;

    // Check if premium is required
    if (asset.is_premium && !hasPremium && !user) {
      router.push('/login?redirect=/assets/' + asset.slug);
      return;
    }

    if (asset.is_premium && !hasPremium) {
      router.push('/pricing');
      return;
    }

    setDownloading(true);
    try {
      const { url, type } = await api.getDownloadUrl(asset.id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = asset.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download asset. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </main>
    );
  }

  if (!asset) {
    return (
      <main style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)' }}>
        <div className="container">
          <p>Asset not found</p>
          <Link href="/assets" className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Assets
          </Link>
        </div>
      </main>
    );
  }

  const canDownload = !asset.is_premium || hasPremium;

  return (
    <main style={{ padding: 'var(--spacing-xl) var(--spacing-lg)' }}>
      <div className="container">
        <Link href="/assets" className="btn btn-outline" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <ArrowLeft size={18} />
          Back to Assets
        </Link>

        <div className="grid" style={{ gridTemplateColumns: '1fr 400px', gap: 'var(--spacing-xl)' }}>
          {/* Asset Preview */}
          <div className="card">
            <div style={{
              aspectRatio: '16/10',
              backgroundColor: 'var(--color-gray-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {asset.preview_file_url || asset.thumbnail_url ? (
                <img
                  src={asset.preview_file_url || asset.thumbnail_url}
                  alt={asset.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: 'var(--color-gray-400)' }}>No preview available</div>
              )}
            </div>
          </div>

          {/* Asset Info */}
          <div>
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div className="card-body">
                <h1 style={{ marginBottom: 'var(--spacing-md)' }}>{asset.title}</h1>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap', marginBottom: 'var(--spacing-md)' }}>
                  <span className="badge">{asset.asset_type}</span>
                  {asset.is_premium && (
                    <span className="badge badge-warning">
                      <Crown size={12} style={{ marginRight: '4px' }} />
                      Premium
                    </span>
                  )}
                  {asset.country_code && (
                    <span className="badge">{asset.country_code}</span>
                  )}
                </div>

                {asset.description && (
                  <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-gray-700)' }}>
                    {asset.description}
                  </p>
                )}

                {/* Metadata */}
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  {asset.dimensions_width && asset.dimensions_height && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                      Dimensions: {asset.dimensions_width} × {asset.dimensions_height}px
                    </p>
                  )}
                  {asset.file_format && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                      Format: {asset.file_format.toUpperCase()}
                    </p>
                  )}
                  {asset.file_size_bytes && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                      Size: {(asset.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                    Downloads: {asset.download_count || 0}
                  </p>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <strong style={{ fontSize: '0.875rem' }}>Tags: </strong>
                    {asset.tags.map((tag: any) => (
                      <span key={tag.id} className="badge" style={{ marginRight: 'var(--spacing-xs)' }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading || (!canDownload && asset.is_premium)}
                  className={`btn ${canDownload ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                >
                  {downloading ? (
                    <>
                      <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                      Downloading...
                    </>
                  ) : canDownload ? (
                    <>
                      <Download size={18} />
                      Download Asset
                    </>
                  ) : (
                    <>
                      <Crown size={18} />
                      Premium Required
                    </>
                  )}
                </button>

                {asset.is_premium && !hasPremium && (
                  <Link href="/pricing" className="btn btn-outline" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}>
                    <Crown size={18} />
                    Get Premium Access
                  </Link>
                )}
              </div>
            </div>

            {/* Related Assets */}
            {asset.category && (
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
                    Category: {asset.category.name}
                  </h3>
                  <Link href={`/assets?category_id=${asset.category.id}`} className="btn btn-sm btn-outline">
                    View More in Category
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
