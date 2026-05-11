'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type SyntheticEvent,
} from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Download, FileImage, FileType, Video } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { FLAG_THUMB_PLACEHOLDER_DATA_URL } from '@/lib/flag-thumbnail-fallback';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';

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

function shortVariantLabel(name: string): string {
  const marker = ' · ';
  const i = name.indexOf(marker);
  if (i >= 0) return name.slice(0, i).trim();
  return name;
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
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <div
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-stone-200 border-t-[#009ab6]"
          aria-hidden
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-stone-50">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-lg font-medium text-stone-900">Couldn&apos;t load this gallery item</p>
          <Link
            href="/gallery"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#009ab6] hover:text-[#007a94]"
          >
            <ArrowLeft size={16} />
            Back to gallery
          </Link>
        </div>
      </main>
    );
  }

  const pageTitle = resolveGalleryDisplayName(
    data.country.name,
    data.country.code ?? null,
    data.country.slug,
  );

  const mainButtonDisabled =
    (selectedFormat &&
      selectedFormat.downloadProtected &&
      isSignedIn &&
      selectedFormat.premiumTier !== 'free' &&
      !isAdmin &&
      !planLoaded) ||
    downloading === selectedFormat?.id;

  return (
    <main className="min-h-screen bg-stone-50 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-14">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-28">
        <Link
          href="/gallery"
          className="group inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft size={15} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
          Gallery
        </Link>

        <header className="mt-8 border-b border-stone-200/80 pb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">Download</p>
          <h1 className="mt-2 text-balance font-semibold tracking-tight text-stone-900 text-4xl sm:text-[2.65rem] sm:leading-[1.1]">
            {pageTitle}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
            {data.variants.length === 1
              ? 'One file in this listing.'
              : `${data.variants.length} uploads available.`}{' '}
            Choose format on the right, preview updates here — one download button.
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-12 lg:mt-14 lg:flex-row lg:gap-14 lg:items-start">
          <div className="min-w-0 flex-1 space-y-8">
            {selectedVariant && selectedFormat ? (
              <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-stone-200/70">
                <div className="flex min-h-[14rem] items-center justify-center bg-[linear-gradient(145deg,#f5f5f4_0%,#fafaf9_48%,#eef2ef_100%)] px-4 py-10 sm:min-h-[16rem] sm:px-8 sm:py-12">
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
                  <img
                    key={`${selectedVariant.id}-${selectedFormat.id}`}
                    src={previewSrcUi(selectedFormat)}
                    alt=""
                    className="max-h-[min(52vh,28rem)] w-auto max-w-full object-contain drop-shadow-md"
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onError={(e) =>
                      imgErrorFallbackChain(e, [selectedVariant.thumbnail])
                    }
                  />
                </div>
                <div className="flex flex-col gap-4 border-t border-stone-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-stone-900" title={selectedVariant.name}>
                      {shortVariantLabel(selectedVariant.name)}
                    </p>
                    {shortVariantLabel(selectedVariant.name) !== selectedVariant.name.trim() ? (
                      <p className="mt-1 text-xs text-stone-500">{selectedVariant.name}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 self-start rounded-full bg-stone-100 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-stone-600 tabular-nums sm:self-center">
                    {selectedFormat.format}
                  </span>
                </div>
              </div>
            ) : null}

            {data.variants.length > 1 ? (
              <section>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  More versions
                </h2>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 pt-0.5">
                  {data.variants.map((variant) => {
                    const format = variant.formats?.[0];
                    const active = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(variant);
                          if (variant.formats && variant.formats.length > 0) {
                            const f0 = variant.formats[0];
                            setSelectedFormat(f0);
                            if (
                              f0.category === 'vector' ||
                              f0.category === 'raster' ||
                              f0.category === 'video'
                            ) {
                              setActiveTab(f0.category);
                            }
                          }
                        }}
                        className={`w-[7.25rem] shrink-0 snap-start rounded-2xl p-2 text-center transition-all ${
                          active
                            ? 'bg-white shadow-md ring-2 ring-[#009ab6]/55'
                            : 'bg-white/60 ring-1 ring-stone-200/90 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="relative aspect-video overflow-hidden rounded-xl bg-stone-100">
                          {format ? (
                            <img
                              key={`${variant.id}-${format.id}-thumb`}
                              src={previewSrcUi(format)}
                              alt=""
                              className="h-full w-full object-contain p-1"
                              referrerPolicy="no-referrer"
                              decoding="async"
                              onError={(e) => imgErrorFallbackChain(e, [variant.thumbnail])}
                            />
                          ) : (
                            <img
                              key={`${variant.id}-vt`}
                              src={variant.thumbnail}
                              alt=""
                              className="h-full w-full object-contain p-1"
                              referrerPolicy="no-referrer"
                              decoding="async"
                              onError={(e) => imgErrorFallbackChain(e, [])}
                            />
                          )}
                        </div>
                        <p className="mt-2 truncate px-0.5 text-[11px] font-medium leading-snug text-stone-700" title={variant.name}>
                          {shortVariantLabel(variant.name)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-[5.25rem] w-full lg:max-w-[22rem] shrink-0 self-start lg:self-stretch">
            <div className="rounded-[1.375rem] bg-white px-5 py-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] ring-1 ring-stone-200/80 lg:px-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Format</h2>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-stone-900">Export</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1">
                {formatCounts.vector > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('vector');
                      applyFlatSelection(allFormatsFlat.find((f) => f.category === 'vector'));
                    }}
                    className={`flex min-w-[4.75rem] flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all sm:text-xs ${
                      activeTab === 'vector'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <FileType size={14} />
                    Vector
                    <span className="tabular-nums text-stone-400">{formatCounts.vector}</span>
                  </button>
                ) : null}
                {formatCounts.raster > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('raster');
                      applyFlatSelection(allFormatsFlat.find((f) => f.category === 'raster'));
                    }}
                    className={`flex min-w-[4.75rem] flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all sm:text-xs ${
                      activeTab === 'raster'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <FileImage size={14} />
                    Raster
                    <span className="tabular-nums text-stone-400">{formatCounts.raster}</span>
                  </button>
                ) : null}
                {formatCounts.video > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('video');
                      applyFlatSelection(allFormatsFlat.find((f) => f.category === 'video'));
                    }}
                    className={`flex min-w-[4.75rem] flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all sm:text-xs ${
                      activeTab === 'video'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Video size={14} />
                    Video
                    <span className="tabular-nums text-stone-400">{formatCounts.video}</span>
                  </button>
                ) : null}
              </div>

              <div className="mt-5 space-y-1.5">
                {filteredFormats.length === 0 ? (
                  <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                    No {activeTab} files in this listing.
                  </p>
                ) : (
                  filteredFormats.map((format) => {
                    const selected = selectedFormat?.id === format.id;
                    return (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => applyFlatSelection(format)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-all ${
                          selected
                            ? 'bg-[#009ab6]/10 ring-1 ring-[#009ab6]/30'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <span
                          className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? 'border-[#009ab6]' : 'border-stone-300'
                          }`}
                          aria-hidden
                        >
                          {selected ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-[#009ab6]" />
                          ) : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-stone-900">{format.format}</span>
                          </div>
                          <p
                            className="mt-0.5 truncate text-xs text-stone-500"
                            title={format.variantName}
                          >
                            {shortVariantLabel(format.variantName)} · {format.dimensions} · {format.size}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Desktop: primary action inside panel */}
              {selectedFormat ? (
                <div className="mt-8 hidden lg:block lg:space-y-2">
                  <button
                    type="button"
                    onClick={() => onDownloadPress(selectedFormat)}
                    disabled={!!mainButtonDisabled}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009ab6] py-4 text-[15px] font-semibold text-white shadow-[0_2px_14px_-2px_rgba(0,154,182,0.45)] transition-all hover:bg-[#008aaa] hover:shadow-[0_4px_20px_-4px_rgba(0,154,182,0.5)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {downloading === selectedFormat.id ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Download size={18} strokeWidth={2} />
                        {downloadLabel(selectedFormat)}
                      </>
                    )}
                  </button>
                  {!isSignedIn ? (
                    <p className="text-center text-xs text-stone-500">
                      <Link
                        href={`/sign-up?redirect_url=${redirectBack}`}
                        className="font-medium text-[#009ab6] hover:underline"
                      >
                        Create an account
                      </Link>{' '}
                      for synced downloads.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile: single sticky download bar */}
      {selectedFormat ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/90 bg-white/85 px-4 py-3 backdrop-blur-lg lg:hidden [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          {!isSignedIn ? (
            <p className="mb-2 text-center text-[11px] text-stone-500">
              <Link href={`/sign-up?redirect_url=${redirectBack}`} className="text-[#009ab6] font-medium">
                Sign up
              </Link>{' '}
              optional
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => onDownloadPress(selectedFormat)}
            disabled={!!mainButtonDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009ab6] py-3.5 text-[15px] font-semibold text-white shadow-[0_-2px_18px_-4px_rgba(0,154,182,0.35)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {downloading === selectedFormat.id ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
                Processing…
              </>
            ) : (
              <>
                <Download size={18} strokeWidth={2} />
                {downloadLabel(selectedFormat)}
              </>
            )}
          </button>
        </div>
      ) : null}
    </main>
  );
}
