'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type SyntheticEvent,
} from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Download, FileImage, FileType, Video, Check } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { FLAG_THUMB_PLACEHOLDER_DATA_URL } from '@/lib/flag-thumbnail-fallback';

type PremiumTier = 'free' | 'freemium' | 'paid';

interface Format {
  id: string;
  format: string;
  formatCode: string;
  category: 'vector' | 'raster' | 'video';
  file: string;
  /** Legacy disk gallery only */
  url?: string;
  previewUrl: string;
  premiumTier: PremiumTier;
  downloadProtected: boolean;
  size: string;
  dimensions: string;
}

interface Variant {
  id: string;
  name: string;
  type: string;
  thumbnail: string;
  formats: Format[];
}

/** Flattened row for sidebar: same as `Format` plus parent variant refs. */
type FormatWithVariant = Format & { variantId: string; variantName: string };

interface CountryData {
  country: {
    name: string;
    slug: string;
    code?: string | null;
  };
  variants: Variant[];
}

function previewSrc(f: Format): string {
  return f.previewUrl || f.url || '';
}

/** Stable display URL per file row (helps when multiple rows share one CDN blob path). Avoid mutating signed URLs. */
function looksSignedDeliveryUrl(src: string): boolean {
  return /([?&](?:X-Amz-Signature|X-Amz-Credential|signature|sig|token)=|\bsig=)/i.test(
    src,
  );
}

function previewSrcUi(f: Format): string {
  const base = previewSrc(f);
  if (!base || base.startsWith('data:')) return base;
  if (looksSignedDeliveryUrl(base)) return base;
  try {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(base, origin);
    u.searchParams.set('pv', f.id);
    return /^https?:/i.test(base) ? u.href : `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}pv=${encodeURIComponent(f.id)}`;
  }
}

function imgErrorFallbackChain(
  e: SyntheticEvent<HTMLImageElement, Event>,
  fallbacks: readonly string[],
) {
  const el = e.target as HTMLImageElement;
  let i = Number(el.dataset.previewFallbackIx || 0);
  if (!Number.isFinite(i)) i = 0;
  for (; i < fallbacks.length; i++) {
    const next = fallbacks[i];
    if (next?.trim() && el.src !== next) {
      el.dataset.previewFallbackIx = String(i + 1);
      el.src = next;
      return;
    }
  }
  el.onerror = null;
  el.src = FLAG_THUMB_PLACEHOLDER_DATA_URL;
}

export default function CountryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const isAdmin = clientClerkUserMatchesAdmin(user);

  const [data, setData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vector' | 'raster' | 'video'>('raster');
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);

  const redirectBack = encodeURIComponent(pathname || '/gallery');

  useEffect(() => {
    if (params.slug) {
      void loadCountryData(params.slug as string);
    }
  }, [params.slug]);

  useEffect(() => {
    let cancelled = false;
    async function loadPlan() {
      if (!isSignedIn) {
        setHasActivePlan(false);
        setPlanLoaded(true);
        return;
      }
      setPlanLoaded(false);
      try {
        const r = await fetch('/api/account/flagswing-plan', { credentials: 'include' });
        const j = (await r.json()) as { hasActivePlan?: boolean };
        if (!cancelled) setHasActivePlan(Boolean(j.hasActivePlan));
      } catch {
        if (!cancelled) setHasActivePlan(false);
      } finally {
        if (!cancelled) setPlanLoaded(true);
      }
    }
    if (clerkLoaded) void loadPlan();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, clerkLoaded]);

  const loadCountryData = async (slug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gallery/country/${slug}`);
      if (response.ok) {
        const countryData = (await response.json()) as CountryData;
        setData(countryData);
        if (countryData.variants && countryData.variants.length > 0) {
          setSelectedVariant(countryData.variants[0]);
          if (countryData.variants[0].formats && countryData.variants[0].formats.length > 0) {
            const firstFmt = countryData.variants[0].formats[0];
            setSelectedFormat(firstFmt);
            if (firstFmt.category === 'vector' || firstFmt.category === 'raster' || firstFmt.category === 'video') {
              setActiveTab(firstFmt.category);
            }
          }
        }
      } else {
        console.error('Failed to load country data');
      }
    } catch (error) {
      console.error('Error loading country data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLegacyDiskDownload = useCallback(
    async (format: Format) => {
      const src = format.url;
      if (!src) return;
      setDownloading(format.id);
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data?.country.name || 'flag'}-${format.formatCode}.${format.formatCode}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        try {
          const link = document.createElement('a');
          link.href = src;
          link.download = `${data?.country.name || 'flag'}-${format.formatCode}.${format.formatCode}`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch {
          alert('Download failed. Please try again.');
        }
      } finally {
        setDownloading(null);
      }
    },
    [data?.country.name]
  );

  const handleProtectedDownload = useCallback(
    async (format: Format) => {
      setDownloading(format.id);
      try {
        const res = await fetch(`/api/download/${format.id}`, {
          credentials: 'include',
          redirect: 'manual',
        });
        if (res.status === 401) {
          router.push(`/sign-in?redirect_url=${redirectBack}`);
          return;
        }
        if (res.status === 403) {
          router.push('/pricing');
          return;
        }
        if (res.status >= 300 && res.status < 400) {
          const loc = res.headers.get('Location');
          if (loc) {
            window.location.href = loc;
            return;
          }
        }
        window.location.href = `/api/download/${format.id}`;
      } finally {
        setDownloading(null);
      }
    },
    [router, redirectBack]
  );

  const downloadLabel = useCallback(
    (format: Format): string => {
      if (!format.downloadProtected && format.url) {
        return `Download ${format.format}`;
      }
      if (!isSignedIn) return 'Sign in to download';
      if (format.premiumTier !== 'free' && !isAdmin) {
        if (!planLoaded) return '…';
        if (!hasActivePlan) return 'Upgrade to download';
      }
      return `Download ${format.format}`;
    },
    [isSignedIn, isAdmin, hasActivePlan, planLoaded]
  );

  const onDownloadPress = useCallback(
    (format: Format) => {
      if (!format.downloadProtected && format.url) {
        void handleLegacyDiskDownload(format);
        return;
      }
      if (!isSignedIn) {
        router.push(`/sign-in?redirect_url=${redirectBack}`);
        return;
      }
      if (format.premiumTier !== 'free' && !isAdmin && !hasActivePlan) {
        if (!planLoaded) return;
        router.push('/pricing');
        return;
      }
      void handleProtectedDownload(format);
    },
    [
      handleLegacyDiskDownload,
      handleProtectedDownload,
      isSignedIn,
      isAdmin,
      hasActivePlan,
      planLoaded,
      router,
      redirectBack,
    ]
  );

  const allFormatsFlat = useMemo((): FormatWithVariant[] => {
    if (!data?.variants?.length) return [];
    return data.variants.flatMap((v) =>
      (v.formats ?? []).map((f) => ({
        ...f,
        variantId: v.id,
        variantName: v.name,
      })),
    );
  }, [data]);

  const formatCounts = useMemo(
    () => ({
      vector: allFormatsFlat.filter((f) => f.category === 'vector').length,
      raster: allFormatsFlat.filter((f) => f.category === 'raster').length,
      video: allFormatsFlat.filter((f) => f.category === 'video').length,
    }),
    [allFormatsFlat],
  );

  const filteredFormats = useMemo(() => {
    return allFormatsFlat.filter((format) => {
      if (activeTab === 'vector') return format.category === 'vector';
      if (activeTab === 'raster') return format.category === 'raster';
      if (activeTab === 'video') return format.category === 'video';
      return true;
    });
  }, [allFormatsFlat, activeTab]);

  const applyFlatSelection = useCallback((entry: FormatWithVariant | undefined) => {
    if (!entry || !data?.variants?.length) return;
    const v = data.variants.find((x) => x.id === entry.variantId);
    if (!v) return;
    setSelectedVariant(v);
    setSelectedFormat(entry);
  }, [data]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009ab6]"></div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-black/60 text-lg mb-4">Country not found</p>
            <Link href="/gallery" className="text-[#009ab6] hover:text-[#007a8a] font-semibold">
              Back to Gallery
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const mainButtonDisabled =
    (selectedFormat &&
      selectedFormat.downloadProtected &&
      isSignedIn &&
      selectedFormat.premiumTier !== 'free' &&
      !isAdmin &&
      !planLoaded) ||
    downloading === selectedFormat?.id;

  const heroFormat = selectedFormat ?? data.variants[0]?.formats?.[0] ?? null;
  const heroPreviewSrc = heroFormat ? previewSrcUi(heroFormat) : '';

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#006d7a]/5 border-b border-[#006d7a]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-black/60 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Gallery</span>
          </Link>
          <div className="flex items-center gap-4 mb-2">
            {heroPreviewSrc ? (
              <div className="w-28 h-[5.25rem] sm:w-32 sm:h-24 shrink-0 overflow-hidden rounded-lg border border-[#006d7a]/15 bg-white shadow-sm flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
                <img
                  key={heroFormat?.id ?? 'hero-header'}
                  src={heroPreviewSrc}
                  alt=""
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  onError={(e) =>
                    imgErrorFallbackChain(e, selectedVariant?.thumbnail ? [selectedVariant.thumbnail] : [])
                  }
                />
              </div>
            ) : null}
            <h1 className="text-4xl md:text-5xl font-bold text-black">{data.country.name} Flags</h1>
          </div>
          <p className="text-black/60">
            {data.variants.length} {data.variants.length === 1 ? 'variant' : 'variants'} available
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedVariant && selectedFormat && (
              <div className="bg-white border-2 border-[#006d7a]/10 rounded-xl overflow-hidden mb-6">
                <div className="aspect-video bg-[#006d7a]/5 relative flex items-center justify-center p-8">
                  <img
                    key={`${selectedVariant.id}-${selectedFormat.id}`}
                    src={previewSrcUi(selectedFormat)}
                    alt={`${data.country.name} ${selectedVariant.name}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onError={(e) =>
                      imgErrorFallbackChain(e, [selectedVariant.thumbnail])
                    }
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-black mb-2">{selectedVariant.name}</h2>
                  <p className="text-black/60 mb-4">Select a format below to download</p>
                  <button
                    type="button"
                    onClick={() => onDownloadPress(selectedFormat)}
                    disabled={!!mainButtonDisabled}
                    className="w-full px-6 py-3 bg-[#009ab6] hover:bg-[#007a8a] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {downloading === selectedFormat.id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        <span>{downloadLabel(selectedFormat)}</span>
                      </>
                    )}
                  </button>
                  {!isSignedIn ? (
                    <p className="mt-2 text-center text-xs text-black/50">
                      No account?{' '}
                      <Link href={`/sign-up?redirect_url=${redirectBack}`} className="text-[#009ab6] font-semibold hover:underline">
                        Sign up
                      </Link>
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Available Flags ({data.variants.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {data.variants.map((variant) => {
                  const format = variant.formats?.[0];
                  return (
                    <div
                      key={variant.id}
                      className={`group relative bg-white border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                        selectedVariant?.id === variant.id
                          ? 'border-[#009ab6] shadow-lg'
                          : 'border-[#006d7a]/10 hover:border-[#009ab6] hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedVariant(variant);
                        if (variant.formats && variant.formats.length > 0) {
                          const f0 = variant.formats[0];
                          setSelectedFormat(f0);
                          if (f0.category === 'vector' || f0.category === 'raster' || f0.category === 'video') {
                            setActiveTab(f0.category);
                          }
                        }
                      }}
                    >
                      <div className="aspect-video bg-[#006d7a]/5 relative overflow-hidden">
                        {format ? (
                          <img
                            key={`${variant.id}-${format.id}-thumb`}
                            src={previewSrcUi(format)}
                            alt={variant.name}
                            className="w-full h-full object-contain p-1 bg-[#006d7a]/5 group-hover:scale-[1.02] transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            decoding="async"
                            onError={(e) => imgErrorFallbackChain(e, [variant.thumbnail])}
                          />
                        ) : (
                          <img
                            key={`${variant.id}-vt`}
                            src={variant.thumbnail}
                            alt={variant.name}
                            className="w-full h-full object-contain p-1 bg-[#006d7a]/5"
                            referrerPolicy="no-referrer"
                            decoding="async"
                            onError={(e) => imgErrorFallbackChain(e, [])}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <Download size={20} className="text-[#009ab6]" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-black text-center truncate">{variant.name}</p>
                        {format ? (
                          <p className="text-xs text-black/60 text-center mt-1">{format.format}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-[#006d7a]/10 rounded-xl p-6 sticky top-8">
              <h3 className="text-xl font-bold text-black mb-4">Download Formats</h3>

              <div className="flex gap-2 mb-4 border-b border-[#006d7a]/10">
                {formatCounts.vector > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('vector');
                      applyFlatSelection(allFormatsFlat.find((f) => f.category === 'vector'));
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'vector'
                        ? 'text-[#009ab6] border-b-2 border-[#009ab6]'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    <FileType size={16} className="inline mr-1" />
                    Vector ({formatCounts.vector})
                  </button>
                )}
                {formatCounts.raster > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('raster');
                      applyFlatSelection(allFormatsFlat.find((f) => f.category === 'raster'));
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'raster'
                        ? 'text-[#009ab6] border-b-2 border-[#009ab6]'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    <FileImage size={16} className="inline mr-1" />
                    Raster ({formatCounts.raster})
                  </button>
                )}
                {formatCounts.video > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('video');
                      applyFlatSelection(allFormatsFlat.find((f) => f.category === 'video'));
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'video'
                        ? 'text-[#009ab6] border-b-2 border-[#009ab6]'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    <Video size={16} className="inline mr-1" />
                    Video ({formatCounts.video})
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {filteredFormats.length === 0 ? (
                  <p className="text-black/60 text-sm text-center py-4">
                    No {activeTab} formats available
                  </p>
                ) : (
                  filteredFormats.map((format) => {
                    const rowBusy =
                      downloading === format.id ||
                      (format.downloadProtected &&
                        isSignedIn &&
                        format.premiumTier !== 'free' &&
                        !isAdmin &&
                        !planLoaded);
                    return (
                      <div
                        key={format.id}
                        onClick={() => applyFlatSelection(format)}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                          selectedFormat?.id === format.id
                            ? 'border-[#009ab6] bg-[#009ab6]/5'
                            : 'border-[#006d7a]/10 hover:border-[#009ab6]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-black">{format.format}</p>
                            <p className="text-xs text-black/60 truncate" title={format.variantName}>
                              {format.variantName}
                            </p>
                            <p className="text-xs text-black/60 mt-0.5">
                              {format.dimensions} • {format.size}
                            </p>
                          </div>
                          {selectedFormat?.id === format.id && (
                            <Check size={20} className="shrink-0 text-[#009ab6]" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFlatSelection(format);
                            onDownloadPress(format);
                          }}
                          disabled={!!rowBusy}
                          className="w-full px-4 py-2 bg-[#009ab6] hover:bg-[#007a8a] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {downloading === format.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              <span>{downloadLabel(format)}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
