'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { CountryHubFolderGrid } from '@/components/gallery/CountryHubFolderGrid';
import { HOME_REGION_HUB_TILES } from '@/lib/gallery/region-hub-tiles';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import type { GalleryContinent } from '@/lib/gallery/country-continent';

type Section = {
  continent: GalleryContinent | 'Other';
  countries: GalleryCountrySummary[];
};

type Props = {
  sections: Section[];
  view: 'grid' | 'list';
};

const TILE_BY_NAME = Object.fromEntries(HOME_REGION_HUB_TILES.map((t) => [t.name, t]));

export function GalleryContinentSections({ sections, view }: Props) {
  return (
    <div className="space-y-12 sm:space-y-14">
      {sections.map((section) => (
        <ContinentBlock key={section.continent} section={section} listView={view === 'list'} />
      ))}
    </div>
  );
}

function ContinentBlock({
  section,
  listView = false,
}: {
  section: Section;
  listView?: boolean;
}) {
  const tile = TILE_BY_NAME[section.continent];
  const href =
    section.continent === 'Other'
      ? '/gallery'
      : `/gallery?region=${encodeURIComponent(section.continent)}`;
  const accent = tile?.accent ?? '#475569';
  const ContinentIcon = tile?.icon;

  return (
    <section aria-labelledby={`continent-${section.continent}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {ContinentIcon ? (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm"
              style={{ backgroundColor: accent }}
            >
              <ContinentIcon size={18} strokeWidth={1.75} className="text-white" aria-hidden />
            </div>
          ) : (
            <div className="h-5 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
          )}
          <div className="min-w-0">
            <h2
              id={`continent-${section.continent}`}
              className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg"
            >
              {section.continent}
            </h2>
            <p className="text-xs text-stone-500">
              {section.countries.length}{' '}
              {section.countries.length === 1 ? 'country' : 'countries'}
            </p>
          </div>
        </div>
        {section.continent !== 'Other' ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 sm:text-sm"
          >
            View all
            <ArrowRight size={13} aria-hidden />
          </Link>
        ) : null}
      </div>
      {listView ? (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          {section.countries.map((country) => (
            <li key={`${country.code ?? 'x'}-${country.slug}-row`}>
              <Link
                href={`/gallery/${country.slug}`}
                className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-stone-50 sm:gap-4 sm:px-4 sm:py-3.5"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-50 ring-1 ring-stone-200 sm:h-16 sm:w-24">
                  <CountryHubFolderCover
                    countryName={country.name}
                    coverUrl={country.webp_cover_url ?? country.thumbnail}
                    hasWebpCover={country.has_webp_cover}
                    imageClassName="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-stone-900">{country.name}</h3>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {country.design_count ?? country.count} designs
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-[#2563eb] opacity-0 transition-opacity group-hover:opacity-100">
                  View <ArrowRight size={14} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <CountryHubFolderGrid countries={section.countries} variant="compact" />
      )}
    </section>
  );
}
