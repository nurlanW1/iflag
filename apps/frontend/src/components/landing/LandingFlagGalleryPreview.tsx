'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

/* ── Speeds (seconds for one full cycle) — all rows go left ── */
const ROW_SPEEDS = [42, 55, 35, 48, 38] as const;

function FlagCard({ country }: { country: GalleryCountrySummary }) {
  return (
    <Link
      href={`/gallery/${encodeURIComponent(country.slug)}`}
      className="group relative block shrink-0 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md"
      style={{ width: 130, height: 100 }}
      tabIndex={-1}
    >
      <div className="relative h-[72px] w-full overflow-hidden bg-neutral-50">
        <CountryHubFolderCover
          countryName={country.name}
          coverUrl={country.webp_cover_url ?? country.thumbnail}
          hasWebpCover={country.has_webp_cover}
          countryCode={country.code}
          imageClassName="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.05]"
        />
      </div>
      <div className="flex items-center justify-center px-1 py-1">
        <p className="truncate text-center text-[10px] font-semibold text-stone-700">
          {country.name}
        </p>
      </div>
    </Link>
  );
}

function MarqueeRow({
  items,
  speed,
  slow,
}: {
  items: GalleryCountrySummary[];
  speed: number;
  slow: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const doubled = [...items, ...items];

  /* Smooth speed change via Web Animations API — no jump */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    for (const anim of el.getAnimations()) {
      anim.playbackRate = slow ? 0.5 : 1;
    }
  }, [slow]);

  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_80px,black_calc(100%-80px),transparent)]">
      <div
        ref={trackRef}
        className="flex gap-2.5 py-0.5"
        style={{
          animation: `marquee-left ${speed}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {doubled.map((country, i) => (
          <FlagCard key={`${country.slug}-${i}`} country={country} />
        ))}
      </div>
    </div>
  );
}

export function LandingFlagGalleryPreview() {
  const [countries, setCountries] = useState<GalleryCountrySummary[]>([]);
  const [slow, setSlow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchJsonWithRetry<{ countries?: GalleryCountrySummary[] }>(
      '/api/gallery/landing-preview?full=1',
      { retries: 2, delayMs: 500 },
    ).then(({ ok, data }) => {
      if (ok && data?.countries && data.countries.length > 0) {
        setCountries(data.countries);
        setReady(true);
      }
    });
  }, []);

  if (!ready || countries.length === 0) {
    return (
      <section className="overflow-hidden border-t border-neutral-200/85 bg-[#fafaf9] py-6">
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((r) => (
            <div key={r} className="flex gap-2.5 px-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[100px] w-[130px] shrink-0 animate-pulse rounded-xl bg-neutral-200/60"
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  const fifth = Math.ceil(countries.length / 5);
  const rows: GalleryCountrySummary[][] = [
    countries.slice(0, fifth),
    countries.slice(fifth, fifth * 2),
    countries.slice(fifth * 2, fifth * 3),
    countries.slice(fifth * 3, fifth * 4),
    countries.slice(fifth * 4),
  ];

  return (
    <section
      className="overflow-hidden border-t border-neutral-200/85 bg-[#fafaf9] py-6"
      onMouseEnter={() => setSlow(true)}
      onMouseLeave={() => setSlow(false)}
    >
      <div className="space-y-2.5">
        {rows.map((row, idx) => (
          <MarqueeRow
            key={idx}
            items={row}
            speed={ROW_SPEEDS[idx] ?? 38}
            slow={slow}
          />
        ))}
      </div>
    </section>
  );
}
