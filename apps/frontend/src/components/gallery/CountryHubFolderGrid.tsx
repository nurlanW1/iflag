'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';

export type CountryHubFolderGridProps = {
  countries: GalleryCountrySummary[];
  /** `/gallery/[slug]` country folder (designs inside). */
  hrefForSlug?: (slug: string) => string;
  variant?: 'gallery' | 'compact';
  /** Extra classes on each folder tile link (e.g. landing drop shadow). */
  tileClassName?: string;
};

function hubHref(slug: string, custom?: (s: string) => string): string {
  return custom ? custom(slug) : `/gallery/${encodeURIComponent(slug)}`;
}

export function CountryHubFolderGrid({
  countries,
  hrefForSlug,
  variant = 'gallery',
  tileClassName = '',
}: CountryHubFolderGridProps) {
  if (!countries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center text-neutral-600">
        <p className="text-base font-medium text-neutral-800">No country folders yet.</p>
        <p className="mt-2 text-sm text-neutral-500">Upload flags to R2 and run import — each country gets its own folder.</p>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={marketplaceProductCardGridClasses}>
        {countries.map((country, idx) => (
          <motion.div
            key={country.id || country.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: Math.min(idx, 12) * 0.02 }}
          >
            <Link
              href={hubHref(country.slug, hrefForSlug)}
              className={clsx(
                'group block overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition-all hover:-translate-y-0.5 hover:border-[#2563eb]/40',
                tileClassName || 'shadow-sm hover:shadow-md',
              )}
            >
              <div
                className={
                  country.has_webp_cover
                    ? 'relative aspect-[4/3] overflow-hidden'
                    : 'relative aspect-[4/3] overflow-hidden bg-stone-50'
                }
              >
                <CountryHubFolderCover
                  countryName={country.name}
                  coverUrl={country.webp_cover_url ?? country.thumbnail}
                  hasWebpCover={country.has_webp_cover}
                  imageClassName="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {country.code ? (
                  <span className="absolute left-2 top-2 z-10 rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                    {country.code}
                  </span>
                ) : null}
              </div>
              <div className="px-3 py-2.5">
                <h3 className="truncate text-sm font-semibold text-stone-900">{country.name}</h3>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {country.design_count} design{country.design_count === 1 ? '' : 's'} in folder
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3.5 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {countries.map((country) => (
        <li key={country.id || country.slug} className="list-none">
          <Link
            href={hubHref(country.slug, hrefForSlug)}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] hover:border-neutral-300 hover:shadow-md"
          >
            <div
              className={
                country.has_webp_cover
                  ? 'relative aspect-[5/4] sm:aspect-[4/3]'
                  : 'relative aspect-[5/4] bg-neutral-50 sm:aspect-[4/3]'
              }
            >
              <CountryHubFolderCover
                countryName={country.name}
                coverUrl={country.webp_cover_url ?? country.thumbnail}
                hasWebpCover={country.has_webp_cover}
                imageClassName="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <p className="text-[0.95rem] font-semibold leading-snug text-[#2a2a2a]">{country.name}</p>
              <p className="text-[0.75rem] font-medium uppercase tracking-wide text-neutral-500">
                {country.design_count} design{country.design_count === 1 ? '' : 's'} in folder
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] opacity-0 transition-opacity group-hover:opacity-100">
                Open folder <ArrowRight size={12} aria-hidden />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
