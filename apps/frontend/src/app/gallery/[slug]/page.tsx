'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type SyntheticEvent,
} from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Download, Lock, Sparkles, ImageOff, Heart, Share2 } from 'lucide-react';
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

interface CountryData {
  country: {
    name: string;
    slug: string;
    code?: string | null;
  };
  variants: Variant[];
}

const CANONICAL_FORMATS = ['AI', 'SVG', 'EPS', 'JPG', 'PNG'] as const;
type CanonicalFormatId = (typeof CANONICAL_FORMATS)[number];

/** Visual identity per format slot — keeps the 5 download cards distinguishable at a glance. */
const FORMAT_META: Record<CanonicalFormatId, { label: string; subtitle: string; accent: string; pill: string }> = {
  AI: {
    label: 'AI',
    subtitle: 'Adobe Illustrator',
    accent: 'from-amber-100 to-amber-50 text-amber-900 ring-amber-200',
    pill: 'bg-amber-500',
  },
  SVG: {
    label: 'SVG',
    subtitle: 'Scalable vector',
    accent: 'from-sky-100 to-sky-50 text-sky-900 ring-sky-200',
    pill: 'bg-sky-500',
  },
  EPS: {
    label: 'EPS',
    subtitle: 'Encapsulated PS',
    accent: 'from-violet-100 to-violet-50 text-violet-900 ring-violet-200',
    pill: 'bg-violet-500',
  },
  JPG: {
    label: 'JPG',
    subtitle: 'Photo raster',
    accent: 'from-rose-100 to-rose-50 text-rose-900 ring-rose-200',
    pill: 'bg-rose-500',
  },
  PNG: {
    label: 'PNG',
    subtitle: 'Transparent',
    accent: 'from-emerald-100 to-emerald-50 text-emerald-900 ring-emerald-200',
    pill: 'bg-emerald-500',
  },
};

/** Priority for *auto* selection when a variant changes; preview-friendly first. */
const DEFAULT_PICK_ORDER: CanonicalFormatId[] = ['PNG', 'JPG', 'SVG', 'EPS', 'AI'];

function findFormatBySlot(variant: Variant | null, slot: CanonicalFormatId): Format | null {
  if (!variant) return null;
  return variant.formats.find((f) => f.format.toUpperCase() === slot) ?? null;
}

function pickDefaultFormat(variant: Variant): Format | null {
  for (const slot of DEFAULT_PICK_ORDER) {
    const f = findFormatBySlot(variant, slot);
    if (f) return f;
  }
  return variant.formats[0] ?? null;
}

function previewSrc(f: Format): string {
  return f.previewUrl || f.url || '';
}

/** Stable display URL per file row (helps when multiple rows share one CDN blob path). Avoid mutating signed URLs. */
function looksSignedDeliveryUrl(src: string): boolean {
  return /([?&](?:X-Amz-Signature|X-Amz-Credential|signature|sig|token)=|\bsig=)/i.test(src);
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

function bigPreviewSrc(variant: Variant | null, format: Format | null): string {
  if (!variant) return FLAG_THUMB_PLACEHOLDER_DATA_URL;
  if (format && (format.category === 'raster' || format.formatCode === 'svg')) {
    return previewSrcUi(format);
  }
  return variant.thumbnail || FLAG_THUMB_PLACEHOLDER_DATA_URL;
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
        const firstVariant = countryData.variants?.[0] ?? null;
        setSelectedVariant(firstVariant);
        setSelectedFormat(firstVariant ? pickDefaultFormat(firstVariant) : null);
      } else {
        console.error('Failed to load country data');
      }
    } catch (error) {
      console.error('Error loading country data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPickVariant = useCallback((variant: Variant) => {
    setSelectedVariant(variant);
    setSelectedFormat(pickDefaultFormat(variant));
  }, []);

  const onPickSlot = useCallback(
    (slot: CanonicalFormatId) => {
      if (!selectedVariant) return;
      const next = findFormatBySlot(selectedVariant, slot);
      if (next) setSelectedFormat(next);
    },
    [selectedVariant],
  );

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
    [data?.country.name],
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
    [router, redirectBack],
  );

  const downloadLabel = useCallback(
    (format: Format): string => {
      if (!format.downloadProtected && format.url) {
        return `Download ${format.format}`;
      }
      if (!isSignedIn) return 'Sign in to download';
      if (format.premiumTier !== 'free' && !isAdmin) {
        if (!planLoaded) return 'Checking plan…';
        if (!hasActivePlan) return 'Upgrade to download';
      }
      return `Download ${format.format}`;
    },
    [isSignedIn, isAdmin, hasActivePlan, planLoaded],
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
    ],
  );

  const availabilityForSelectedVariant = useMemo(() => {
    const map: Partial<Record<CanonicalFormatId, Format>> = {};
    for (const slot of CANONICAL_FORMATS) {
      const f = findFormatBySlot(selectedVariant, slot);
      if (f) map[slot] = f;
    }
    return map;
  }, [selectedVariant]);

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
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
            <ImageOff size={24} aria-hidden />
          </div>
          <p className="text-lg font-medium text-stone-900">
            Couldn&apos;t load this flag collection
          </p>
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

  const downloadDisabled =
    !selectedFormat ||
    downloading === selectedFormat.id ||
    (selectedFormat.downloadProtected &&
      isSignedIn &&
      selectedFormat.premiumTier !== 'free' &&
      !isAdmin &&
      !planLoaded);

  return (
    <main className="min-h-screen bg-stone-50 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-12">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <nav className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-stone-900"
          >
            <ArrowLeft
              size={14}
              strokeWidth={2}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Gallery
          </Link>
          <span className="text-stone-300">/</span>
          <span className="truncate text-stone-700">{pageTitle}</span>
        </nav>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              <Sparkles size={12} className="text-[#009ab6]" aria-hidden />
              Flag collection
              {data.country.code ? (
                <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-600">
                  {data.country.code}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {pageTitle}
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              <span className="font-semibold text-stone-800">{data.variants.length}</span>{' '}
              {data.variants.length === 1 ? 'design' : 'designs'} ·{' '}
              <span className="font-semibold text-stone-800">
                {data.variants.reduce((s, v) => s + v.formats.length, 0)}
              </span>{' '}
              total files
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              aria-label="Save to favorites"
            >
              <Heart size={14} aria-hidden />
              Save
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              aria-label="Share collection"
              onClick={() => {
                if (typeof window === 'undefined') return;
                const url = window.location.href;
                if (navigator.share) {
                  void navigator.share({ title: pageTitle, url }).catch(() => {
                    void navigator.clipboard.writeText(url);
                  });
                } else {
                  void navigator.clipboard.writeText(url);
                }
              }}
            >
              <Share2 size={14} aria-hidden />
              Share
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            {selectedVariant ? (
              <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-stone-200/70">
                <div
                  className="relative flex min-h-[22rem] items-center justify-center px-4 py-8 sm:min-h-[28rem] sm:px-8 sm:py-10 lg:min-h-[32rem]"
                  style={{ background: 'linear-gradient(145deg,#f5f5f4 0%,#fafaf9 48%,#eef2ef 100%)' }}
                >
                  {selectedFormat && tierBadge(selectedFormat) ? (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 ring-1 ring-amber-200/80">
                      <Lock size={10} aria-hidden /> {tierBadge(selectedFormat)}
                    </span>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
                  <img
                    key={`${selectedVariant.id}-${selectedFormat?.id ?? 'cover'}`}
                    src={bigPreviewSrc(selectedVariant, selectedFormat)}
                    alt={`${pageTitle} — ${selectedVariant.name}`}
                    className="max-h-[min(58vh,32rem)] w-auto max-w-full object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.18)]"
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onError={(e) =>
                      imgErrorFallbackChain(
                        e,
                        [selectedVariant.thumbnail],
                        flagThumbPlaceholderForFileId(selectedVariant.id),
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-1 border-t border-stone-100 px-5 py-3 text-center sm:px-6">
                  <p className="truncate text-sm font-medium text-stone-700" title={selectedVariant.name}>
                    {selectedVariant.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {selectedVariant.formats.length} format
                    {selectedVariant.formats.length === 1 ? '' : 's'} available
                  </p>
                </div>
              </div>
            ) : null}

            {data.variants.length > 1 ? (
              <section className="rounded-[1.25rem] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-stone-200/70 sm:px-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                      Other designs
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-stone-900">
                      Choose another shape or style
                    </h2>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                    {data.variants.length}
                  </span>
                </div>

                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:-mx-5 sm:px-5">
                  {data.variants.map((v) => {
                    const isActive = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onPickVariant(v)}
                        className={`group w-[7.5rem] shrink-0 text-left transition-transform sm:w-32 ${
                          isActive ? '-translate-y-0.5' : 'hover:-translate-y-0.5'
                        }`}
                      >
                        <div
                          className={`relative aspect-square overflow-hidden rounded-2xl bg-stone-100 transition-all ${
                            isActive
                              ? 'ring-2 ring-[#009ab6] ring-offset-2 ring-offset-white shadow-[0_10px_30px_-14px_rgba(0,154,182,0.5)]'
                              : 'ring-1 ring-stone-200 group-hover:ring-stone-300'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN previews */}
                          <img
                            src={v.thumbnail}
                            alt={v.name}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                            onError={(e) =>
                              imgErrorFallbackChain(
                                e,
                                [],
                                flagThumbPlaceholderForFileId(v.id),
                              )
                            }
                          />
                          <span className="absolute right-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            {v.formats.length}
                          </span>
                        </div>
                        <p
                          className={`mt-2 line-clamp-2 px-0.5 text-[11px] font-medium leading-tight ${
                            isActive ? 'text-stone-900' : 'text-stone-600'
                          }`}
                          title={v.name}
                        >
                          {v.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="w-full shrink-0 self-start lg:sticky lg:top-[5rem]">
            <div className="overflow-hidden rounded-[1.25rem] bg-white px-5 py-6 shadow-[0_14px_50px_-24px_rgba(15,23,42,0.35)] ring-1 ring-stone-200/90">
              <div className="border-b border-stone-100 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  Download formats
                </p>
                <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-stone-900">
                  Pick any of 5 file types
                </h2>
                <p className="mt-1.5 text-xs leading-snug text-stone-500">
                  AI · SVG · EPS keep crisp at any size. JPG · PNG are ready for the web.
                </p>
              </div>

              <ul className="mt-4 space-y-2">
                {CANONICAL_FORMATS.map((slot) => {
                  const fmt = availabilityForSelectedVariant[slot] ?? null;
                  const meta = FORMAT_META[slot];
                  const available = !!fmt;
                  const isSelected = available && selectedFormat?.id === fmt!.id;
                  const badge = available ? tierBadge(fmt!) : null;
                  return (
                    <li key={slot}>
                      <button
                        type="button"
                        disabled={!available}
                        onClick={() => onPickSlot(slot)}
                        aria-pressed={isSelected}
                        className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all sm:gap-4 sm:px-3.5 sm:py-3 ${
                          isSelected
                            ? 'border-[#009ab6] bg-gradient-to-br from-[#009ab6]/[0.07] to-white ring-[3px] ring-[#009ab6]/20'
                            : available
                              ? 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                              : 'cursor-not-allowed border-stone-100 bg-stone-50/60 opacity-65'
                        }`}
                      >
                        <div
                          className={`flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-mono text-sm font-extrabold tracking-tight ring-1 sm:h-[3.25rem] sm:w-[3.75rem] ${
                            available ? meta.accent : 'from-stone-100 to-stone-50 text-stone-400 ring-stone-200'
                          }`}
                        >
                          {meta.label}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-stone-900">{meta.label}</span>
                            <span className={`h-1.5 w-1.5 rounded-full ${available ? meta.pill : 'bg-stone-300'}`} />
                            <span className="text-[11px] uppercase tracking-wide text-stone-400">
                              {meta.subtitle}
                            </span>
                            {badge ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900 ring-1 ring-amber-200/80">
                                <Lock size={9} aria-hidden /> {badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-stone-500 sm:text-xs">
                            {available
                              ? `${fmt!.dimensions} · ${fmt!.size}`
                              : 'Not available for this design'}
                          </p>
                        </div>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected
                              ? 'border-[#009ab6]'
                              : available
                                ? 'border-stone-300 group-hover:border-stone-400'
                                : 'border-stone-200'
                          }`}
                          aria-hidden
                        >
                          {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-[#009ab6]" /> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {selectedFormat ? (
                <div className="mt-5 hidden lg:block lg:space-y-2">
                  <button
                    type="button"
                    onClick={() => onDownloadPress(selectedFormat)}
                    disabled={!!downloadDisabled}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#009ab6] to-[#007a94] py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_14px_-2px_rgba(0,154,182,0.45)] transition-all hover:from-[#008aaa] hover:to-[#006d80] hover:shadow-[0_4px_20px_-4px_rgba(0,154,182,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
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

      {selectedFormat ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/90 bg-white/85 px-4 py-3 backdrop-blur-lg lg:hidden [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onDownloadPress(selectedFormat)}
            disabled={!!downloadDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009ab6] py-3.5 text-[15px] font-semibold text-white shadow-[0_-2px_18px_-4px_rgba(0,154,182,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
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
