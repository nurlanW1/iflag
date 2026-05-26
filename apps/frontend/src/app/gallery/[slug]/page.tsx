'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import {
  FLAG_THUMB_PLACEHOLDER_DATA_URL,
  flagThumbPlaceholderForFileId,
} from '@/lib/flag-thumbnail-fallback';
import { resolveGalleryDisplayName } from '@/lib/gallery-display-name';

interface Variant {
  id: string;
  productSlug: string;
  name: string;
  type: string;
  thumbnail: string;
  formats: Array<{ format: string; formatCode?: string }>;
}

interface CountryData {
  country: {
    name: string;
    slug: string;
    code?: string | null;
    cover_image_url?: string | null;
    has_webp_cover?: boolean;
    webp_cover_url?: string | null;
  };
  variants: Variant[];
}

/** Country folder hub: one card per design (`asset_group_key`), links to `/assets/[productSlug]`. */
export default function CountryHubPage() {
  const params = useParams();
  const [data, setData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      void loadCountryData(params.slug as string);
    }
  }, [params.slug]);

  const loadCountryData = async (slug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gallery/country/${slug}`);
      if (response.ok) {
        const countryData = (await response.json()) as CountryData;
        setData(countryData);
      } else {
        console.error('Failed to load country data');
      }
    } catch (error) {
      console.error('Error loading country data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[var(--brand-blue)]"
          aria-hidden
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ImageOff size={24} aria-hidden />
          </div>
          <p className="text-lg font-medium text-slate-900">Couldn&apos;t load this country folder</p>
          <Link
            href="/gallery"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-blue)] hover:underline"
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

  const hasWebpCover = Boolean(data.country.has_webp_cover);
  const webpCover = data.country.webp_cover_url?.trim() || data.country.cover_image_url?.trim() || '';

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
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {pageTitle}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {data.variants.length} design{data.variants.length === 1 ? '' : 's'} — open a tile to choose
            formats and download. Files named only with the country name (e.g. Algeria) are free official flags;
            other designs require a plan.
          </p>
        </div>
        <div className="mx-auto w-full max-w-[min(100%,20rem)] shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_12px_-6px_rgba(15,23,42,0.1)] sm:max-w-[min(100%,24rem)] sm:rounded-2xl lg:mx-0">
          <div className="relative aspect-[4/3] bg-slate-100">
            <ProductPreviewImage className="absolute inset-0" watermarkEnabled protectEnabled>
              <CountryHubFolderCover
                countryName={pageTitle}
                coverUrl={webpCover}
                hasWebpCover={hasWebpCover}
                className="absolute inset-0"
                imageClassName="h-full w-full object-contain p-4"
              />
            </ProductPreviewImage>
          </div>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="designs-heading">
        <h2 id="designs-heading" className="sr-only">
          Flag designs for {pageTitle}
        </h2>
        <ul className="grid grid-cols-1 gap-3.5 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {data.variants.map((v) => {
            const href = `/assets/${encodeURIComponent(v.productSlug)}`;
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
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <ProductPreviewImage className="absolute inset-0" watermarkEnabled protectEnabled>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.thumbnail || FLAG_THUMB_PLACEHOLDER_DATA_URL}
                        alt={v.name}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.onerror = null;
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
      </section>
    </main>
  );
}
