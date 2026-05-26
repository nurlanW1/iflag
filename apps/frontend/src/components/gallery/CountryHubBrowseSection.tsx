'use client';

import { useEffect, useState } from 'react';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { CountryHubFolderGrid } from '@/components/gallery/CountryHubFolderGrid';

type Props = {
  /** e.g. `/api/gallery/countries` or `/api/categories/asia` */
  fetchPath: string;
};

export function CountryHubBrowseSection({ fetchPath }: Props) {
  const [countries, setCountries] = useState<GalleryCountrySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(fetchPath, { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setCountries([]);
          return;
        }
        const j = (await res.json()) as { countries?: GalleryCountrySummary[] };
        if (!cancelled) setCountries(j.countries ?? []);
      } catch {
        if (!cancelled) setCountries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPath]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  return <CountryHubFolderGrid countries={countries} variant="compact" />;
}
