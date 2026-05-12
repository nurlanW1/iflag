'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type SyntheticEvent,
} from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  FileImage,
  FileType,
  Video,
  Cpu,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { clientClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
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
  lastResortSrc: string = FLAG_THUMB_PLACEHOLDER_DATA_URL,
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
  el.src = lastResortSrc;
}

function shortVariantLabel(name: string): string {
  const marker = ' · ';
  const i = name.indexOf(marker);
  if (i >= 0) return name.slice(0, i).trim();
  return name;
}

function tierBadge(format: Format): string | null {
  if (format.premiumTier === 'paid') return 'Paid';
  if (format.premiumTier === 'freemium') return 'Premium';
  return null;
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
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-28">
        <Link
          href="/gallery"
          className="group inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft size={15} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
          Gallery
        </Link>

        <header className="mt-8 border-b border-stone-200/80 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">Download</p>
          <h1 className="mt-2 text-balance font-semibold tracking-tight text-stone-900 text-4xl sm:text-[2.65rem] sm:leading-[1.1]">
            {pageTitle}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
            {data.variants.length === 1
              ? 'Single edition.'
              : `${data.variants.length} editions.`}{' '}
            Tune variant and export on the panel — the preview follows your choice.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0 space-y-5">
            {selectedVariant && selectedFormat ? (
              <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-stone-200/70">
                <div className="flex min-h-[20rem] items-center justify-center bg-[#6b6b68] px-4 py-8 sm:min-h-[26rem] lg:min-h-[31rem] xl:min-h-[34rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
                  <img
                    key={`${selectedVariant.id}-${selectedFormat.id}`}
                    src={previewSrcUi(selectedFormat)}
                    alt={`${pageTitle} ${selectedFormat.format} preview`}
                    className="max-h-[min(62vh,34rem)] w-auto max-w-full object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,0.25)]"
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onError={(e) =>
                      imgErrorFallbackChain(e, [selectedVariant.thumbnail], flagThumbPlaceholderForFileId(selectedFormat.id))
                    }
                  />
                </div>
                <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-4 text-center sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-600" title={selectedVariant.name}>
                      {shortVariantLabel(selectedVariant.name)}
                    </p>
                    {shortVariantLabel(selectedVariant.name) !== selectedVariant.name.trim() ? (
                      <p className="mt-1 text-xs text-stone-500">{selectedVariant.name}</p>
                    ) : null}
                  </div>
                  <span className="mx-auto shrink-0 rounded-full bg-stone-100 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-stone-600 tabular-nums">
                    {selectedFormat.format}
                  </span>
                </div>
              </div>
            ) : null}

            {allFormatsFlat.length > 0 ? (
              <section className="rounded-[1.25rem] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-stone-200/70 sm:px-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                      More from this flag
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-stone-900">
                      Other shapes and formats
                    </h2>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                    {allFormatsFlat.length}
                  </span>
                </div>

                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] sm:-mx-5 sm:px-5">
                  {allFormatsFlat.map((format) => {
                    const selected = selectedFormat?.id === format.id;
                    const badge = tierBadge(format);
                    return (
                      <button
                        key={`${format.variantId}-${format.id}-thumb`}
                        type="button"
                        onClick={() => applyFlatSelection(format)}
                        className={`group w-24 shrink-0 text-left transition-transform hover:-translate-y-0.5 ${
                          selected ? '-translate-y-0.5' : ''
                        }`}
                      >
                        <div
                          className={`aspect-[4/3] overflow-hidden rounded-xl bg-stone-200 transition-all ${
                            selected
                              ? 'ring-2 ring-[#009ab6] ring-offset-2 ring-offset-white'
                              : 'ring-1 ring-stone-200 group-hover:ring-stone-300'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
                          <img
                            src={previewSrcUi(format)}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            decoding="async"
                            loading="lazy"
                            onError={(e) =>
                              imgErrorFallbackChain(
                                e,
                                [format.previewUrl],
                                flagThumbPlaceholderForFileId(format.id),
                              )
                            }
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-stone-600">
                            {format.format}
                          </span>
                          {badge ? (
                            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-900">
                              {badge}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

          </div>

          <aside className="w-full shrink-0 self-start lg:sticky lg:top-[5.25rem]">
            <div className="overflow-hidden rounded-[1.25rem] bg-white px-5 py-6 shadow-[0_14px_50px_-24px_rgba(15,23,42,0.35)] ring-1 ring-stone-200/90">
              <div className="flex items-start justify-between gap-3 border-b border-stone-100/90 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                    Download
                  </p>
                  <h2 className="mt-1.5 font-semibold tracking-tight text-xl text-stone-900 leading-snug">
                    {selectedFormat ? selectedFormat.format : 'Select file'}
                  </h2>
                  <p className="mt-1.5 max-w-[15rem] text-xs leading-snug text-stone-500">
                    Choose a file type and download the selected preview.
                  </p>
                </div>
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#009ab6]/10 text-[#009ab6] sm:flex">
                  <Cpu size={20} aria-hidden />
                </div>
              </div>

              <section className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-stone-400" aria-hidden />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Output category
                  </span>
                </div>
                <div className="grid grid-flow-col gap-1 auto-cols-fr rounded-[0.875rem] bg-stone-200/60 p-1">
                  {formatCounts.vector > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('vector');
                        applyFlatSelection(allFormatsFlat.find((f) => f.category === 'vector'));
                      }}
                      className={`flex flex-col items-center gap-1 rounded-lg px-1.5 py-2.5 text-center transition-all sm:flex-row sm:justify-center sm:gap-2 sm:py-3 ${
                        activeTab === 'vector'
                          ? 'bg-white text-stone-900 shadow-sm shadow-stone-900/8'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <FileType size={16} strokeWidth={2} className="shrink-0 opacity-85" />
                      <span className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">
                        Vector
                      </span>
                      <span className="text-[10px] tabular-nums text-stone-400 sm:text-xs">
                        ({formatCounts.vector})
                      </span>
                    </button>
                  ) : null}
                  {formatCounts.raster > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('raster');
                        applyFlatSelection(allFormatsFlat.find((f) => f.category === 'raster'));
                      }}
                      className={`flex flex-col items-center gap-1 rounded-lg px-1.5 py-2.5 text-center transition-all sm:flex-row sm:justify-center sm:gap-2 sm:py-3 ${
                        activeTab === 'raster'
                          ? 'bg-white text-stone-900 shadow-sm shadow-stone-900/8'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <FileImage size={16} strokeWidth={2} className="shrink-0 opacity-85" />
                      <span className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">
                        Raster
                      </span>
                      <span className="text-[10px] tabular-nums text-stone-400 sm:text-xs">
                        ({formatCounts.raster})
                      </span>
                    </button>
                  ) : null}
                  {formatCounts.video > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('video');
                        applyFlatSelection(allFormatsFlat.find((f) => f.category === 'video'));
                      }}
                      className={`flex flex-col items-center gap-1 rounded-lg px-1.5 py-2.5 text-center transition-all sm:flex-row sm:justify-center sm:gap-2 sm:py-3 ${
                        activeTab === 'video'
                          ? 'bg-white text-stone-900 shadow-sm shadow-stone-900/8'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Video size={16} strokeWidth={2} className="shrink-0 opacity-85" />
                      <span className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">
                        Video
                      </span>
                      <span className="text-[10px] tabular-nums text-stone-400 sm:text-xs">
                        ({formatCounts.video})
                      </span>
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    File formats
                  </span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                    Active: {activeTab}
                  </span>
                </div>
                <div className="max-h-[min(42vh,20rem)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {filteredFormats.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 px-4 py-10 text-center text-sm text-stone-500">
                      No matching files in{' '}
                      <span className="font-semibold lowercase text-stone-700">{activeTab}</span>.
                    </div>
                  ) : (
                    filteredFormats.map((format) => {
                      const selected = selectedFormat?.id === format.id;
                      const badge = tierBadge(format);
                      return (
                        <button
                          key={format.id}
                          type="button"
                          onClick={() => applyFlatSelection(format)}
                          className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all sm:gap-4 sm:py-3.5 ${
                            selected
                              ? 'border-[#009ab6]/45 bg-gradient-to-br from-[#009ab6]/[0.07] to-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] ring-[3px] ring-[#009ab6]/20'
                              : 'border-transparent bg-stone-50/85 hover:border-stone-200 hover:bg-white'
                          }`}
                        >
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] font-bold uppercase leading-none tracking-wide sm:h-[3.25rem] sm:w-[3.25rem] sm:text-xs ${
                              selected
                                ? 'bg-[#009ab6] text-white shadow-inner'
                                : 'bg-white text-stone-700 shadow-sm ring-1 ring-stone-200/80 group-hover:text-stone-900'
                            }`}
                          >
                            {format.format}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold text-stone-900">{format.file}</span>
                              {badge ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80">
                                  <Lock size={9} aria-hidden /> {badge}
                                </span>
                              ) : null}
                            </div>
                            <p
                              className="mt-0.5 truncate text-[11px] text-stone-500 sm:text-xs"
                              title={format.variantName}
                            >
                              {shortVariantLabel(format.variantName)} · {format.dimensions} · {format.size}
                            </p>
                          </div>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              selected ? 'border-[#009ab6]' : 'border-stone-300 group-hover:border-stone-400'
                            }`}
                            aria-hidden
                          >
                            {selected ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#009ab6]" />
                            ) : null}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

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
