'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ImageOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { FlagVideoPreview } from '@/components/media/FlagVideoPreview';
import { hrefLooksLikeFlagVideo, isFlagVideoFormat } from '@/lib/flag-video-formats';
import { CountryDesignTierCrown } from '@/components/gallery/CountryDesignTierCrown';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { shouldWatermarkFlagPreview } from '@/lib/gallery/flag-preview-watermark';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';
import { hrefLooksLikeNonBrowserMaster, pickFormatPreviewUrl } from '@/lib/flag-preview-display';
import COUNTRY_FACTS from '../../../../content/countries/facts.json';
import COUNTRY_COLORS from '../../../../content/countries/flag-colors.json';
import { FlagColorPalette } from '@/components/gallery/FlagColorPalette';
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
    <ul className="grid grid-cols-1 gap-3.5 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="list-none overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-50" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Country folder hub: description + one card per design (`asset_group_key`). */
export default function CountryHubPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [data, setData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular' | 'price'>('newest');

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

  const sortedVariants = useMemo(() => {
    if (!data?.variants) return [];
    const v = [...data.variants];
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
  }, [data?.variants, sortOrder]);

  if (loading) {
    return (
      <main className="marketplace-shell min-h-screen bg-[#fafaf9] pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-2/3 max-w-md animate-pulse rounded bg-slate-100" />
            <div className="h-20 max-w-xl animate-pulse rounded bg-slate-50" />
          </div>
          <div className="aspect-[4/3] w-full max-w-sm animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <section className="mt-10">
          <DesignGridSkeleton />
        </section>
      </main>
    );
  }

  if (!data || loadError) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ImageOff size={24} aria-hidden />
          </div>
          <p className="text-lg font-medium text-slate-900">Couldn&apos;t load this country folder</p>
          <p className="mt-2 text-sm text-slate-500">
            Check your connection or try again — flags load from the database and R2 storage.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {slug ? (
              <button
                type="button"
                onClick={() => void loadCountryData(slug)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-hover)]"
              >
                <RefreshCw size={16} aria-hidden />
                Retry
              </button>
            ) : null}
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-blue)] hover:underline"
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
    <main className="marketplace-shell min-h-screen bg-[#fafaf9] pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-24">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href="/gallery"
          className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-900"
        >
          <ArrowLeft
            size={14}
            strokeWidth={2}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Gallery
        </Link>
        <span className="text-slate-300">/</span>
        <span className="truncate text-slate-700">{pageTitle}</span>
      </nav>

      <header className="mt-4 border-b border-slate-200/80 pb-6 sm:mt-6 sm:pb-8 lg:pb-10">
        <div className="flex items-start gap-5 lg:gap-8">
          {/* Text column */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Country folder
            </p>
            {/* Heading row — mobile flag inline right */}
            <div className="flex items-start gap-3">
              <h1 className="flex-1 text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {pageTitle}
              </h1>
              {/* Mobile flag — natural size, shadow only */}
              {webpCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={webpCover}
                  alt={`${pageTitle} flag`}
                  width={80}
                  className="shrink-0 rounded-[3px] shadow-[0_3px_14px_rgba(0,0,0,0.16)] lg:hidden"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
              ) : null}
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {data.country.region ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  🌎 {data.country.region}
                </span>
              ) : null}
              {data.country.code ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  🏳 {data.country.code}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                ✦ Sovereign
              </span>
            </div>
            {/* Description */}
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {description}
            </p>
            {/* Country facts — inline, no panel */}
            {facts && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                <span>
                  <span className="mr-1 text-slate-400">Capital</span>
                  <span className="font-semibold text-slate-700">{facts.capital}</span>
                </span>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <span>
                  <span className="mr-1 text-slate-400">Population</span>
                  <span className="font-semibold text-slate-700">~{facts.population}</span>
                </span>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <span>
                  <span className="mr-1 text-slate-400">Area</span>
                  <span className="font-semibold text-slate-700">{facts.area}</span>
                </span>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <span>
                  <span className="mr-1 text-slate-400">Currency</span>
                  <span className="font-semibold text-slate-700">{facts.currency}</span>
                </span>
              </div>
            )}
          </div>
          {/* Desktop: flag + color palette stacked */}
          <div className="hidden shrink-0 flex-col gap-3 lg:flex" style={{ width: 220 }}>
            {webpCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={webpCover}
                alt={`${pageTitle} flag`}
                width={220}
                className="w-full rounded-[4px] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                draggable={false}
              />
            ) : null}
            {flagColors.length > 0 && (
              <FlagColorPalette colors={flagColors} />
            )}
          </div>
        </div>
        {/* Mobile color palette (below description) */}
        {flagColors.length > 0 && (
          <div className="mt-4 lg:hidden">
            <FlagColorPalette colors={flagColors} />
          </div>
        )}
      </header>

      <section className="mt-10" aria-labelledby="designs-heading">
        <h2 id="designs-heading" className="sr-only">
          Flag designs for {pageTitle}
        </h2>
        {data.variants.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
            No published designs for this country yet.
          </p>
        ) : (
          <>
            {/* Sort bar */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500">
                <span className="font-semibold text-slate-800">{sortedVariants.length}</span>{' '}
                design{sortedVariants.length === 1 ? '' : 's'}
              </p>
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'popular' | 'price')}
                  aria-label="Sort designs"
                  className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                  <option value="price">Price</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>▾</span>
              </div>
            </div>
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
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-slate-300 hover:shadow-md"
                  >
                    <div
                      className={clsx(
                        'relative bg-[#fafaf9]',
                        showVideo ? 'aspect-video bg-stone-900' : 'aspect-[4/3]',
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
                              if (!isPremium && hasWebpCover && webpCover && el.src !== webpCover) {
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
                      <p className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-slate-900">
                        {v.name}
                      </p>
                      <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {v.type}
                      </p>
                      {fmtLabel ? (
                        <p className="mt-auto line-clamp-2 text-[11px] text-slate-600">{fmtLabel}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          </>
        )}
      </section>
    </main>
  );
}
