'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

// desktop cols × rows; mobile/tablet show fewer cols via CSS grid
const TOTAL = 42; // enough for up to 7 cols × 6 rows

function FlagImage({ country, eager }: { country: GalleryCountrySummary; eager: boolean }) {
  const src = (country.webp_cover_url ?? country.thumbnail ?? '').trim();
  if (!src) return <div className="h-full w-full bg-neutral-200" />;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={country.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'low'}
      draggable={false}
      className="h-full w-full object-cover"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

export function LandingFlagGalleryPreview() {
  const [flags, setFlags] = useState<GalleryCountrySummary[]>([]);

  useEffect(() => {
    fetchJsonWithRetry<{ countries?: GalleryCountrySummary[] }>(
      '/api/gallery/landing-preview?full=1',
      { retries: 2, delayMs: 500 },
    ).then(({ ok, data }) => {
      if (ok && data?.countries && data.countries.length > 0) {
        const EXCLUDED = new Set(['israel']);
        const sorted = [...data.countries]
          .filter((c) => !EXCLUDED.has(c.slug?.toLowerCase() ?? ''))
          .sort((a, b) => a.name.localeCompare(b.name));
        setFlags(sorted.slice(0, TOTAL));
      }
    });
  }, []);

  const gridClass =
    'grid gap-[3px] grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7';

  const skeleton = (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-4">
      <div className="marketplace-shell">
        <div className={gridClass}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className="aspect-[3/2] animate-pulse rounded-sm bg-neutral-200/60" />
          ))}
        </div>
      </div>
    </section>
  );

  if (flags.length === 0) return skeleton;

  return (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-4">
      <div className="marketplace-shell">
        <div className={gridClass}>
          {flags.map((country, idx) => (
            <Link
              key={country.slug}
              href={`/gallery/${encodeURIComponent(country.slug)}`}
              className="block"
              style={{
                aspectRatio: '3/2',
                overflow: 'hidden',
                borderRadius: '2px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}
            >
              <FlagImage country={country} eager={idx < 5} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
