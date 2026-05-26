'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ImageOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { shouldWatermarkFlagPreview } from '@/lib/gallery/flag-preview-watermark';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';

interface Variant {
  id: string;
  productSlug: string;
  name: string;
  type: string;
  thumbnail: string;
  isPremiumDesign?: boolean;
  formats: Array<{ format: string; formatCode?: string; premiumTier?: string }>;
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
  const description =
    data.country.description?.trim() ||
    `${pageTitle} — browse flag designs and download formats below.`;

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

      <header className="mt-4 flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:mt-6 sm:gap-6 sm:pb-8 lg:flex-row lg:items-stretch lg:justify-between lg:gap-10 lg:pb-10">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Country folder
            {data.country.region ? (
              <span className="normal-case tracking-normal text-slate-500"> · {data.country.region}</span>
            ) : null}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {pageTitle}
          </h1>
          <p className="max-w-2xl line-clamp-5 text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
        <div className="mx-auto w-full max-w-[min(100%,20rem)] shrink-0 sm:max-w-[min(100%,24rem)] lg:mx-0">
          <div className="relative aspect-[4/3]">
            <CountryHubFolderCover
              countryName={pageTitle}
              coverUrl={webpCover}
              hasWebpCover={hasWebpCover}
              className="absolute inset-0"
              imageClassName="h-full w-full object-contain"
              priority
            />
          </div>
        </div>
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
          <ul className="grid grid-cols-1 gap-3.5 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
            {data.variants.map((v) => {
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
              return (
                <li key={v.id} className="list-none">
                  <Link
                    href={href}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] bg-[#fafaf9]">
                      <ProductPreviewImage
                        className="absolute inset-0"
                        watermarkEnabled={showWatermark}
                        protectEnabled={false}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail || FLAG_THUMB_PLACEHOLDER_DATA_URL}
                          alt={v.name}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          draggable={false}
                          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                          onError={(e) => {
                            const el = e.currentTarget;
                            el.onerror = null;
                            if (!isPremium && hasWebpCover && webpCover && el.src !== webpCover) {
                              el.src = webpCover;
                              return;
                            }
                            el.src = flagThumbPlaceholderForFileId(v.id);
                          }}
                        />
                      </ProductPreviewImage>
                      <span className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                        {v.formats.length} formats
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
        )}
      </section>
    </main>
  );
}
