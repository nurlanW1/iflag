'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { CountryHubFolderGrid } from '@/components/gallery/CountryHubFolderGrid';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';

type Props = {
  /** e.g. `/api/gallery/countries` or `/api/categories/asia` */
  fetchPath: string;
};

export function CountryHubBrowseSection({ fetchPath }: Props) {
  const [countries, setCountries] = useState<GalleryCountrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const { ok, data } = await fetchJsonWithRetry<{ countries?: GalleryCountrySummary[] }>(
        fetchPath,
        { retries: 2, delayMs: 500 },
      );
      if (ok && data?.countries) {
        setCountries(data.countries);
      } else {
        setCountries([]);
        setLoadFailed(true);
      }
    } catch {
      setCountries([]);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fetchPath]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (loadFailed || countries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-neutral-800">
          {loadFailed ? 'Could not load country folders.' : 'No country folders in this view yet.'}
        </p>
        {loadFailed ? (
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-hover)]"
          >
            <RefreshCw size={16} aria-hidden />
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  return <CountryHubFolderGrid countries={countries} variant="compact" />;
}
