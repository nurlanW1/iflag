'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

const COLS = 7;
const ROWS = 5;
const TOTAL = COLS * ROWS; // 35 flags

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function LandingFlagGalleryPreview() {
  const [flags, setFlags] = useState<GalleryCountrySummary[]>([]);

  useEffect(() => {
    fetchJsonWithRetry<{ countries?: GalleryCountrySummary[] }>(
      '/api/gallery/landing-preview?full=1',
      { retries: 2, delayMs: 500 },
    ).then(({ ok, data }) => {
      if (ok && data?.countries && data.countries.length > 0) {
        setFlags(shuffle(data.countries).slice(0, TOTAL));
      }
    });
  }, []);

  if (flags.length === 0) {
    return (
      <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] animate-pulse rounded-lg bg-neutral-200/60"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-7 gap-2">
          {flags.map((country) => (
            <Link
              key={country.slug}
              href={`/gallery/${encodeURIComponent(country.slug)}`}
              className="group block overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md"
            >
              <div className="aspect-[3/2] w-full overflow-hidden bg-neutral-50">
                <CountryHubFolderCover
                  countryName={country.name}
                  coverUrl={country.webp_cover_url ?? country.thumbnail}
                  hasWebpCover={country.has_webp_cover}
                  imageClassName="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
