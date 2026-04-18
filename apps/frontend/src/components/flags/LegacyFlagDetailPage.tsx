'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ZoomIn,
  Maximize2,
  Edit,
  BarChart3,
  Share2,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';
import VariantGallery from '@/components/FlagDetail/VariantGallery';
import FormatCard from '@/components/FlagDetail/FormatCard';
import PremiumCTA from '@/components/FlagDetail/PremiumCTA';
import AdminControls from '@/components/FlagDetail/AdminControls';

type FormatTab = 'vector' | 'raster' | 'video';

export default function LegacyFlagDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [flag, setFlag] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FormatTab>('vector');
  const [hasPremium, setHasPremium] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPremiumCTA, setShowPremiumCTA] = useState(false);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFlagData();
    checkPremium();
  }, [params.slug, user]);

  const loadFlagData = async () => {
    try {
      const data = await api.getAssetBySlug(params.slug as string);
      setFlag(data);

      if (data.variants && data.variants.length > 0) {
        const defaultVariant = data.variants.find((v: any) => v.is_default) || data.variants[0];
        setSelectedVariantId(defaultVariant.id);
      }
    } catch (error) {
      console.error('Failed to load flag:', error);
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

  const selectedVariant = flag?.variants?.find((v: any) => v.id === selectedVariantId);
  const variantFormats = selectedVariant?.assets || [];

  const filteredFormats = variantFormats.filter((asset: any) => {
    const formatCategory = asset.format?.format_category || '';
    switch (activeTab) {
      case 'vector':
        return formatCategory === 'vector';
      case 'raster':
        return formatCategory === 'raster';
      case 'video':
        return formatCategory === 'video';
      default:
        return true;
    }
  });

  const formatCounts = {
    vector: variantFormats.filter((a: any) => a.format?.format_category === 'vector').length,
    raster: variantFormats.filter((a: any) => a.format?.format_category === 'raster').length,
    video: variantFormats.filter((a: any) => a.format?.format_category === 'video').length,
  };

  const handleDownload = async (assetId: string, formatId: string, requiresSubscription: boolean) => {
    if (requiresSubscription && !hasPremium) {
      setShowPremiumCTA(true);
      return;
    }

    setDownloading((prev) => new Set(prev).add(assetId));

    try {
      const { url } = await api.getDownloadUrl(assetId, formatId);

      const link = document.createElement('a');
      link.href = url;
      link.download = selectedVariant?.variant_name || flag?.title || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading((prev) => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
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

  if (!flag) {
    return (
      <main style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)' }}>
        <div className="container">
          <p>Flag not found</p>
          <Link href="/assets" className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Assets
          </Link>
        </div>
      </main>
    );
  }

  const isAdmin = user?.role === 'admin';
  const previewAlt = `${flag.title} flag`;

  return (
    <main style={{ padding: 'var(--spacing-xl) var(--spacing-lg)' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <Link href="/assets" className="btn btn-sm btn-outline">
              <ArrowLeft size={18} />
              Back
            </Link>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>{flag.title}</h1>
              <div
                style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}
              >
                {flag.country_code && <span className="badge">{flag.country_code}</span>}
                {flag.organization_name && <span className="badge">{flag.organization_name}</span>}
                {flag.category && <span className="badge">{flag.category.name}</span>}
                {isAdmin && <StatusBadge status={flag.status} isPremium={flag.is_premium} />}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button type="button" className="btn btn-sm btn-outline">
              <Share2 size={18} />
              Share
            </button>
            <button type="button" className="btn btn-sm btn-outline">
              <Heart size={18} />
            </button>
            {isAdmin && (
              <>
                <Link href={`/admin/assets/${flag.id}`} className="btn btn-sm btn-primary">
                  <Edit size={18} />
                  Edit
                </Link>
                <button type="button" className="btn btn-sm btn-outline">
                  <BarChart3 size={18} />
                  Stats
                </button>
              </>
            )}
          </div>
        </div>

        {isAdmin && <AdminControls asset={flag} onUpdate={loadFlagData} />}

        {flag.variants && flag.variants.length > 1 && (
          <VariantGallery
            variants={flag.variants}
            selectedVariantId={selectedVariantId}
            onVariantSelect={setSelectedVariantId}
          />
        )}

        <div className="grid" style={{ gridTemplateColumns: '1fr 400px', gap: 'var(--spacing-xl)' }}>
          <div>
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div
                style={{
                  aspectRatio: '16/10',
                  backgroundColor: 'var(--color-gray-100)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedVariant?.preview_url ? (
                  <>
                    <img
                      src={selectedVariant.preview_url}
                      alt={previewAlt}
                      style={{
                        width: `${100 * previewZoom}%`,
                        height: `${100 * previewZoom}%`,
                        objectFit: 'contain',
                        transition: 'transform var(--transition-base)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'var(--spacing-md)',
                        right: 'var(--spacing-md)',
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewZoom((p) => Math.min(2, p + 0.1))}
                        className="btn btn-sm"
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
                      >
                        <ZoomIn size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(true)}
                        className="btn btn-sm"
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--color-gray-400)' }}>No preview available</div>
                )}
              </div>
            </div>

            <div className="card">
              <div style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vector')}
                    style={{
                      padding: 'var(--spacing-md)',
                      border: 'none',
                      borderBottom:
                        activeTab === 'vector'
                          ? '2px solid var(--color-primary)'
                          : '2px solid transparent',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontWeight: activeTab === 'vector' ? 600 : 400,
                      color: activeTab === 'vector' ? 'var(--color-primary)' : 'var(--color-gray-700)',
                    }}
                  >
                    Vector ({formatCounts.vector})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raster')}
                    style={{
                      padding: 'var(--spacing-md)',
                      border: 'none',
                      borderBottom:
                        activeTab === 'raster'
                          ? '2px solid var(--color-primary)'
                          : '2px solid transparent',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontWeight: activeTab === 'raster' ? 600 : 400,
                      color: activeTab === 'raster' ? 'var(--color-primary)' : 'var(--color-gray-700)',
                    }}
                  >
                    Raster ({formatCounts.raster})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('video')}
                    style={{
                      padding: 'var(--spacing-md)',
                      border: 'none',
                      borderBottom:
                        activeTab === 'video'
                          ? '2px solid var(--color-primary)'
                          : '2px solid transparent',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontWeight: activeTab === 'video' ? 600 : 400,
                      color: activeTab === 'video' ? 'var(--color-primary)' : 'var(--color-gray-700)',
                    }}
                  >
                    Video ({formatCounts.video})
                  </button>
                </div>
              </div>

              <div className="card-body">
                {filteredFormats.length > 0 ? (
                  <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-md)' }}>
                    {filteredFormats.map((asset: any) => {
                      const price = asset.price || { price_cents: 0, requires_subscription: false };
                      const canDownload = !price.requires_subscription || hasPremium;
                      const isDownloading = downloading.has(asset.id);

                      return (
                        <FormatCard
                          key={asset.id}
                          format={asset.format}
                          asset={asset}
                          price={price}
                          hasAccess={canDownload}
                          isDownloading={isDownloading}
                          onDownload={() =>
                            handleDownload(asset.id, asset.format_id, price.requires_subscription)
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 'var(--spacing-3xl)',
                      color: 'var(--color-gray-500)',
                    }}
                  >
                    No {activeTab} formats available for this variant
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            {flag.description && (
              <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Description</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)', lineHeight: 1.6 }}>
                    {flag.description}
                  </p>
                </div>
              </div>
            )}

            {flag.tags && flag.tags.length > 0 && (
              <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Tags</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                    {flag.tags.map((tag: any) => (
                      <span key={tag.id} className="badge">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showPremiumCTA && !hasPremium && (
              <PremiumCTA
                premiumFormatsCount={
                  filteredFormats.filter((f: any) => f.price?.requires_subscription).length
                }
                onDismiss={() => setShowPremiumCTA(false)}
                variant="banner"
              />
            )}

            {!hasPremium &&
              filteredFormats.some((f: any) => f.price?.requires_subscription) &&
              !showPremiumCTA && (
                <PremiumCTA
                  premiumFormatsCount={
                    filteredFormats.filter((f: any) => f.price?.requires_subscription).length
                  }
                  variant="banner"
                />
              )}

            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Download Rules</h3>
                <ul
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-gray-700)',
                    paddingLeft: 'var(--spacing-lg)',
                    lineHeight: 1.8,
                  }}
                >
                  <li>Free formats: Direct download</li>
                  <li>Premium formats: Subscription required</li>
                  <li>Watermarked previews available for free</li>
                  <li>Commercial license included with premium</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
