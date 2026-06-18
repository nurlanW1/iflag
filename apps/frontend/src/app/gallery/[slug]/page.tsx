'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ImageOff, RefreshCw, Layers, FileCode2, Image as ImageIcon, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { FlagVideoPreview } from '@/components/media/FlagVideoPreview';
import { hrefLooksLikeFlagVideo, isFlagVideoFormat } from '@/lib/flag-video-formats';
import { CountryDesignTierCrown } from '@/components/gallery/CountryDesignTierCrown';
import { shouldWatermarkFlagPreview } from '@/lib/gallery/flag-preview-watermark';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { ShutterstockCard } from '@/components/flags/ShutterstockCard';
import { hrefLooksLikeNonBrowserMaster, pickFormatPreviewUrl } from '@/lib/flag-preview-display';
import COUNTRY_FACTS from '../../../../content/countries/facts.json';
import COUNTRY_COLORS from '../../../../content/countries/flag-colors.json';
import { FlagColorPalette } from '@/components/gallery/FlagColorPalette';
import { WorldMapPin } from '@/components/gallery/WorldMapPin';
import type { FlagColor } from '@/components/gallery/FlagColorPalette';

type CountryFact = { capital: string; population: string; area: string; currency: string };
const countryFacts = COUNTRY_FACTS as Record<string, CountryFact>;
const countryColors = COUNTRY_COLORS as Record<string, FlagColor[]>;

interface Variant {
  id: string;
  productSlug: string;
  name: string;
  type: string;
  thumbnail: string;
  isPremiumDesign?: boolean;
  formats: Array<{
    format: string;
    formatCode?: string;
    premiumTier?: string;
    previewUrl?: string;
  }>;
}

interface SSImage {
  id: string;
  description: string;
  thumbUrl: string;
  shutterUrl: string;
}

interface CountryData {
  country: {
    name: string;
    slug: string;
    code?: string | null;
    region?: string | null;
    description?: string;
    cover_image_url?: string | null;
    has_webp_cover?: boolean;
    webp_cover_url?: string | null;
    design_count?: number;
    file_count?: number;
  };
  variants: Variant[];
}

function DesignGridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="list-none overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-50" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Format tabs for the designs section
const FORMAT_TABS = [
  { id: 'all',   label: 'All',    Icon: Layers,       match: (_f: string) => true },
  { id: 'svg',   label: 'Vector', Icon: FileCode2,    match: (f: string) => /svg|eps|ai/i.test(f) },
  { id: 'png',   label: 'PNG',    Icon: ImageIcon,    match: (f: string) => /png|webp/i.test(f) },
  { id: 'jpg',   label: 'JPG',    Icon: ImageIcon,    match: (f: string) => /jpe?g/i.test(f) },
  { id: 'video', label: 'Video',  Icon: Clapperboard, match: (f: string) => /mp4|webm|mov|video/i.test(f) },
] as const;
type FormatTabId = typeof FORMAT_TABS[number]['id'];

function variantMatchesFormat(v: Variant, fmtId: FormatTabId): boolean {
  if (fmtId === 'all') return true;
  const tab = FORMAT_TABS.find(t => t.id === fmtId);
  if (!tab) return true;
  // Check variant type
  if (tab.match(v.type)) return true;
  // Check any format code/name
  return v.formats.some(f => tab.match(f.formatCode ?? f.format ?? ''));
}

export default function CountryHubPage() {
  const params = useParams();
  const sp = useSearchParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [data, setData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular' | 'price'>('newest');
  const [ssImages, setSsImages] = useState<SSImage[]>([]);
  const [ssPage, setSsPage] = useState(1);
  const [ssLoading, setSsLoading] = useState(false);
  const [ssHasMore, setSsHasMore] = useState(true);
  const ssSentinelRef = useRef<HTMLDivElement | null>(null);
  const ssCountryRef = useRef<string>('');

  // Format filter from URL ?format=svg|png|jpg|video
  const formatParam = (sp.get('format') ?? 'all') as FormatTabId;
  const activeFormat: FormatTabId = FORMAT_TABS.some(t => t.id === formatParam) ? formatParam : 'all';

  const setFormat = (id: FormatTabId) => {
    const p = new URLSearchParams();
    if (id !== 'all') p.set('format', id);
    router.replace(`/gallery/${slug}${p.size > 0 ? `?${p.toString()}` : ''}`, { scroll: false });
  };

  const loadCountryData = useCallback(async (countrySlug: string) => {
    setLoading(true);
    setLoadError(false);
    try {
      const { ok, data: countryData } = await fetchJsonWithRetry<CountryData>(
        `/api/gallery/country/${encodeURIComponent(countrySlug)}`,
        { retries: 2, delayMs: 500 },
      );
      if (ok && countryData?.country) {
        setData(countryData);
      } else {
        setData(null);
        setLoadError(true);
      }
    } catch {
      setData(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) void loadCountryData(slug);
  }, [slug, loadCountryData]);

  // Fetch one page of Shutterstock results
  const fetchSsPage = useCallback(async (countryName: string, page: number) => {
    setSsLoading(true);
    try {
      const q = `${countryName} flag`;
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');
      const r = await fetch(
        `${apiUrl}/shutterstock/search?q=${encodeURIComponent(q)}&per_page=12&page=${page}`,
      );
      if (!r.ok) throw new Error('ss-fetch-failed');
      const res = (await r.json()) as { results?: SSImage[] };
      const batch = res.results ?? [];
      setSsImages((prev) => (page === 1 ? batch : [...prev, ...batch]));
      setSsHasMore(batch.length === 12);
    } catch {
      setSsHasMore(false);
    } finally {
      setSsLoading(false);
    }
  }, []);

  // Reset SS when country changes
  useEffect(() => {
    if (!data?.country?.name) return;
    const name = data.country.name;
    if (ssCountryRef.current === name) return;
    ssCountryRef.current = name;
    setSsImages([]);
    setSsPage(1);
    setSsHasMore(true);
    void fetchSsPage(name, 1);
  }, [data?.country?.name, fetchSsPage]);

  // Load next page when ssPage increments (skip page 1 — already loaded above)
  useEffect(() => {
    if (ssPage === 1) return;
    if (!ssCountryRef.current) return;
    void fetchSsPage(ssCountryRef.current, ssPage);
  }, [ssPage, fetchSsPage]);

  // IntersectionObserver — fire when sentinel enters viewport
  useEffect(() => {
    if (!ssSentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && ssHasMore && !ssLoading) {
          setSsPage((p) => p + 1);
        }
      },
      { rootMargin: '300px' },
    );
    obs.observe(ssSentinelRef.current);
    return () => obs.disconnect();
  }, [ssHasMore, ssLoading]);

  const sortedVariants = useMemo(() => {
    if (!data?.variants) return [];
    let v = data.variants.filter(variant => variantMatchesFormat(variant, activeFormat));
    v = [...v];
    switch (sortOrder) {
      case 'popular':
        return v.sort((a, b) => b.formats.length - a.formats.length || a.name.localeCompare(b.name));
      case 'price':
        return v.sort((a, b) => {
          const aP = a.isPremiumDesign ? 1 : 0;
          const bP = b.isPremiumDesign ? 1 : 0;
          return aP - bP || a.name.localeCompare(b.name);
        });
      default:
        return v;
    }
  }, [data?.variants, sortOrder, activeFormat]);

  if (loading) {
    return (
      <main className="marketplace-shell min-h-screen bg-[#fafaf9] pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_45%]">
          <div className="space-y-4">
            <div className="h-20 w-44 animate-pulse rounded-md bg-neutral-100" />
            <div className="h-14 w-3/4 animate-pulse rounded bg-neutral-100" />
            <div className="h-16 max-w-lg animate-pulse rounded bg-neutral-50" />
          </div>
          <div className="aspect-[3/2] animate-pulse rounded-xl bg-neutral-100" />
        </div>
        <section className="mt-10">
          <DesignGridSkeleton />
        </section>
      </main>
    );
  }

  if (!data || loadError) {
    return (
      <main className="min-h-screen bg-[#fafaf9]">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
            <ImageOff size={24} aria-hidden />
          </div>
          <p className="text-lg font-semibold text-[#2a2a2a]">Couldn&apos;t load this country folder</p>
          <p className="mt-2 text-sm text-neutral-500">
            Check your connection or try again — flags load from the database and R2 storage.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {slug ? (
              <button
                type="button"
                onClick={() => void loadCountryData(slug)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-blue-hover)]"
              >
                <RefreshCw size={16} aria-hidden />
                Retry
              </button>
            ) : null}
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to gallery
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const pageTitle = resolveGalleryDisplayName(
    data.country.name,
    data.country.code ?? null,
    data.country.slug,
  );

  const hasWebpCover = Boolean(data.country.has_webp_cover);
  const webpCover = data.country.webp_cover_url?.trim() || data.country.cover_image_url?.trim() || '';

  const facts: CountryFact | null = countryFacts[data.country.slug] ?? null;
  const flagColors: FlagColor[] = countryColors[data.country.slug] ?? [];

  const description = (() => {
    const base = data.country.description?.trim();
    if (base) return base;
    const region = data.country.region ? ` in ${data.country.region}` : '';
    const cap  = facts ? ` Capital city is ${facts.capital}.` : '';
    const pop  = facts ? ` Population: ~${facts.population}.` : '';
    const area = facts ? ` Total area: ${facts.area}.` : '';
    const cur  = facts ? ` Official currency: ${facts.currency}.` : '';
    return `${pageTitle} is a sovereign country${region}.${cap}${pop}${area}${cur}`;
  })();

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* ── Hero section ── */}
      <div className="marketplace-shell pt-8 sm:pt-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-neutral-400">
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft size={13} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
            Gallery
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="truncate text-neutral-500">{pageTitle}</span>
        </nav>

        {/* Two-column hero */}
        <div className="mt-6 grid items-start gap-0 lg:grid-cols-[1fr_38%] lg:gap-6 xl:grid-cols-[1fr_40%]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-2.5 pb-6 lg:pb-8">

            {/* Small flag */}
            {webpCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={webpCover}
                alt={`${pageTitle} flag`}
                className="rounded-[3px] object-contain shadow-[0_3px_16px_rgba(0,0,0,0.15)]"
                style={{ width: 'auto', maxWidth: 200, height: 'auto', maxHeight: 130 }}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                draggable={false}
              />
            ) : null}

            {/* Country name — Baskerville serif */}
            <h1
              className="text-balance text-5xl font-normal leading-tight text-[#2a2a2a] sm:text-6xl lg:text-[4.5rem]"
              style={{ fontFamily: "'Baskerville Old Face', 'Libre Baskerville', var(--font-baskerville), Georgia, serif" }}
            >
              {pageTitle}
            </h1>

            {/* Description */}
            <p className="max-w-lg text-sm leading-relaxed text-neutral-500 sm:text-base">
              {description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {data.country.region ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  {data.country.region}
                </span>
              ) : null}
              {data.country.code ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  {data.country.code}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Sovereign
              </span>
            </div>

            {/* Facts */}
            {facts && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {/* Capital */}
                <span className="inline-flex items-center gap-1.5" title="Capital">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400" aria-label="Capital"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span className="font-semibold text-[#2a2a2a]">{facts.capital}</span>
                </span>
                <span className="hidden text-neutral-200 sm:inline">·</span>
                {/* Population */}
                <span className="inline-flex items-center gap-1.5" title="Population">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400" aria-label="Population"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span className="font-semibold text-[#2a2a2a]">~{facts.population}</span>
                </span>
                <span className="hidden text-neutral-200 sm:inline">·</span>
                {/* Area */}
                <span className="inline-flex items-center gap-1.5" title="Area">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400" aria-label="Area"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>
                  <span className="font-semibold text-[#2a2a2a]">{facts.area}</span>
                </span>
                <span className="hidden text-neutral-200 sm:inline">·</span>
                {/* Currency */}
                <span className="inline-flex items-center gap-1.5" title="Currency">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400" aria-label="Currency"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  <span className="font-semibold text-[#2a2a2a]">{facts.currency}</span>
                </span>
              </div>
            )}

            {/* Color palette — inline, no card */}
            {flagColors.length > 0 && (
              <div className="mt-2">
                <FlagColorPalette colors={flagColors} />
              </div>
            )}

          </div>

          {/* ── Right column: world map ── */}
          <div className="hidden lg:block lg:self-start">
            <WorldMapPin slug={data.country.slug} />
          </div>
        </div>
      </div>

      {/* ── Designs section ── */}
      <div className="marketplace-shell border-t border-neutral-200/60 pb-16 pt-8 sm:pb-20 lg:pb-24">
        <section aria-labelledby="designs-heading">
          <h2 id="designs-heading" className="sr-only">
            Flag designs for {pageTitle}
          </h2>

          {data.variants.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center text-neutral-500">
              No published designs for this country yet.
            </p>
          ) : (
            <>
              {/* Format + Sort bar */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                {/* Format filter tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {FORMAT_TABS.map(({ id, label, Icon }) => {
                    const active = activeFormat === id;
                    const count = id === 'all'
                      ? (data?.variants.length ?? 0)
                      : (data?.variants.filter(v => variantMatchesFormat(v, id)).length ?? 0);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFormat(id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          active
                            ? 'bg-[var(--brand-blue)] text-white shadow-sm shadow-[#2563eb]/30'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        <Icon size={12} aria-hidden />
                        {label}
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                          active ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-neutral-500">
                    <span className="font-semibold text-[#2a2a2a]">{sortedVariants.length}</span>{' '}
                    design{sortedVariants.length === 1 ? '' : 's'}
                  </p>
                  <div className="relative">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'popular' | 'price')}
                      aria-label="Sort designs"
                      className="h-9 appearance-none rounded-xl border border-neutral-200 bg-white pl-3 pr-8 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/15"
                    >
                      <option value="newest">Newest</option>
                      <option value="popular">Popular</option>
                      <option value="price">Price</option>
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>▾</span>
                  </div>
                </div>
              </div>

              {/* ── Flagswing assets grid ── */}
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                    {sortedVariants.map((v) => {
                      const href = `/assets/${encodeURIComponent(v.productSlug)}`;
                      const isPremium =
                        v.isPremiumDesign ??
                        v.formats.some((f) => {
                          const t = (f.premiumTier ?? 'free').toLowerCase();
                          return t === 'paid' || t === 'freemium';
                        });
                      const showWatermark = shouldWatermarkFlagPreview({ isPremiumDesign: isPremium });
                      const fmtLabel = v.formats
                        .map((f) => f.format)
                        .filter(Boolean)
                        .slice(0, 4)
                        .join(' · ');
                      const thumb =
                        pickFormatPreviewUrl(
                          v.formats.map((f) => ({
                            format: f.formatCode ?? f.format,
                            formatCode: f.formatCode,
                            previewUrl: f.previewUrl,
                          })),
                          [v.thumbnail, webpCover].filter(
                            (u): u is string => Boolean(u?.trim()) && !hrefLooksLikeNonBrowserMaster(u),
                          ),
                        ) ||
                        v.thumbnail ||
                        webpCover ||
                        FLAG_THUMB_PLACEHOLDER_DATA_URL;
                      const videoFromFormat = v.formats
                        .map((f) => f.previewUrl?.trim())
                        .find((u) => u && hrefLooksLikeFlagVideo(u));
                      const videoSrc = hrefLooksLikeFlagVideo(thumb)
                        ? thumb
                        : videoFromFormat || '';
                      const showVideo =
                        Boolean(videoSrc) ||
                        v.type.toLowerCase().includes('video') ||
                        v.formats.some((f) => isFlagVideoFormat(f.formatCode ?? f.format));

                      return (
                        <li key={v.id} className="list-none">
                          <Link
                            href={href}
                            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-neutral-300 hover:shadow-md"
                          >
                            <div
                              className={clsx(
                                'relative bg-[#fafaf9]',
                                showVideo ? 'aspect-video bg-neutral-900' : 'aspect-[4/3]',
                              )}
                            >
                              <CountryDesignTierCrown premium={isPremium} />
                              {showVideo && videoSrc ? (
                                <FlagVideoPreview
                                  src={videoSrc}
                                  title={v.name}
                                  poster={hrefLooksLikeFlagVideo(thumb) ? undefined : thumb}
                                  playOverlay
                                  hoverPreview
                                  className="absolute inset-0"
                                />
                              ) : (
                                <ProductPreviewImage
                                  className="absolute inset-0"
                                  watermarkEnabled={showWatermark}
                                  protectEnabled={false}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={thumb}
                                    alt={v.name}
                                    loading="lazy"
                                    decoding="async"
                                    referrerPolicy="no-referrer"
                                    draggable={false}
                                    className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                                    onError={(e) => {
                                      const el = e.currentTarget;
                                      el.onerror = null;
                                      const rasterFallback = pickFormatPreviewUrl(
                                        v.formats.map((f) => ({
                                          format: f.formatCode ?? f.format,
                                          formatCode: f.formatCode,
                                          previewUrl: f.previewUrl,
                                        })),
                                        [webpCover].filter(Boolean) as string[],
                                      );
                                      if (rasterFallback && el.src !== rasterFallback) {
                                        el.src = rasterFallback;
                                        return;
                                      }
                                      if (webpCover && el.src !== webpCover) {
                                        el.src = webpCover;
                                        return;
                                      }
                                      el.src = flagThumbPlaceholderForFileId(v.id);
                                    }}
                                  />
                                </ProductPreviewImage>
                              )}
                              <span className="absolute right-2 top-2 flex flex-col items-end gap-1">
                                {showVideo ? (
                                  <span className="rounded-md bg-[#DF0024]/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                                    Video
                                  </span>
                                ) : null}
                                <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                                  {v.formats.length} formats
                                </span>
                              </span>
                            </div>
                            <div className="flex flex-1 flex-col gap-1.5 p-4">
                              <p className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-[#2a2a2a]">
                                {v.name}
                              </p>
                              <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                                {v.type}
                              </p>
                              {fmtLabel ? (
                                <p className="mt-auto line-clamp-2 text-[11px] text-neutral-500">{fmtLabel}</p>
                              ) : null}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
              </ul>

              {/* ── Shutterstock section (after FW assets) ── */}
              {(ssImages.length > 0 || ssLoading) && (
                <div className="mt-10 border-t border-neutral-200/60 pt-8">
                  <div className="mb-5 flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-[#2a2a2a]">
                      More {pageTitle} flag images
                    </h3>
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                      Shutterstock
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                    {ssImages.map((img) => (
                      <ShutterstockCard key={img.id} {...img} />
                    ))}
                  </div>

                  {/* Infinite scroll sentinel */}
                  <div ref={ssSentinelRef} className="h-4" />

                  {/* Loading spinner */}
                  {ssLoading && (
                    <div className="flex justify-center py-6">
                      <svg
                        className="h-6 w-6 animate-spin text-neutral-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-label="Loading"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                  )}

                  {!ssLoading && !ssHasMore && ssImages.length > 0 && (
                    <p className="mt-4 text-center text-xs text-neutral-400">
                      * Images from Shutterstock. Clicking opens Shutterstock for licensing.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

      </div>
    </main>
  );
}
