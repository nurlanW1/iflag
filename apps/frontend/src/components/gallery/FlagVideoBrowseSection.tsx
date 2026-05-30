'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { FlagVideoGalleryGrid } from '@/components/gallery/FlagVideoGalleryGrid';
import { fetchJsonWithRetry } from '@/lib/fetch-with-retry';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';
import type { FlagVideoSummary } from '@/types/flag-video-gallery';

export function FlagVideoBrowseSection() {
  const [videos, setVideos] = useState<FlagVideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const { ok, data } = await fetchJsonWithRetry<{ videos?: FlagVideoSummary[] }>(
        '/api/gallery/videos',
        { retries: 2, delayMs: 500 },
      );
      if (ok && data?.videos) {
        setVideos(data.videos);
      } else {
        setVideos([]);
        setLoadFailed(!ok);
      }
    } catch {
      setVideos([]);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className={marketplaceProductCardGridClasses}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
            <div className="aspect-video animate-pulse bg-stone-200" />
            <div className="space-y-2 px-3 py-2.5">
              <div className="h-3.5 w-[75%] animate-pulse rounded bg-stone-100" />
              <div className="h-2.5 w-[40%] animate-pulse rounded bg-stone-50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-neutral-800">Could not load flag videos.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-hover)]"
        >
          <RefreshCw size={16} aria-hidden />
          Retry
        </button>
      </div>
    );
  }

  return <FlagVideoGalleryGrid videos={videos} />;
}
