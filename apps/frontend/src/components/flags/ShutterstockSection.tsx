'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ShutterstockCard } from '@/components/flags/ShutterstockCard';
import { FreeStockSection } from '@/components/flags/FreeStockSection';
import { PartnerLinks } from '@/components/affiliates/PartnerLinks';

interface SSImage {
  id: string;
  description: string;
  thumbUrl: string;
  shutterUrl: string;
}

interface Props {
  countryName: string;
}

export function ShutterstockSection({ countryName }: Props) {
  const [ssImages, setSsImages] = useState<SSImage[]>([]);
  const [ssLoading, setSsLoading] = useState(false);
  const [ssHasMore, setSsHasMore] = useState(false);
  const [ssFetched, setSsFetched] = useState(false);
  const ssPageRef = useRef(1);
  const loadingRef = useRef(false);

  const fetchSsImages = useCallback(async (name: string, page: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setSsLoading(true);
    try {
      const q = encodeURIComponent(`${name} flag`);
      const r = await fetch(`/api/shutterstock/search?q=${q}&per_page=12&page=${page}`);
      const res = r.ok ? await r.json() : { results: [] };
      const batch: SSImage[] = res.results ?? [];
      setSsImages((prev) => (page === 1 ? batch : [...prev, ...batch]));
      setSsHasMore(batch.length === 12);
    } catch {
      setSsHasMore(false);
    } finally {
      setSsLoading(false);
      setSsFetched(true);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!countryName) return;
    ssPageRef.current = 1;
    setSsImages([]);
    setSsFetched(false);
    setSsHasMore(false);
    void fetchSsImages(countryName, 1);
  }, [countryName, fetchSsImages]);

  const sentinelRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting && ssHasMore && !loadingRef.current) {
            const nextPage = ssPageRef.current + 1;
            ssPageRef.current = nextPage;
            void fetchSsImages(countryName, nextPage);
          }
        },
        { rootMargin: '400px' },
      );
      obs.observe(el);
      return () => obs.disconnect();
    },
    [ssHasMore, countryName, fetchSsImages],
  );

  return (
    <>
      {(ssLoading || ssFetched) && (
        <div className="mt-10 border-t border-neutral-200/60 pt-8">
          <div className="mb-5 flex items-center gap-2.5">
            <h3 className="text-base font-semibold text-[#2a2a2a]">
              More {countryName} flag images
            </h3>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-200">
              Shutterstock
            </span>
          </div>

          {ssLoading && ssImages.length === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
                  <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-50" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {ssImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {ssImages.map((img) => (
                <ShutterstockCard key={img.id} {...img} />
              ))}
            </div>
          )}

          {ssHasMore && <div ref={sentinelRef} className="h-2" />}

          {ssLoading && ssImages.length > 0 && (
            <div className="flex justify-center py-6">
              <svg className="h-6 w-6 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          )}

          {ssFetched && !ssLoading && ssImages.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-400">
              No stock images found for {countryName}.
            </p>
          )}

          {ssFetched && !ssHasMore && ssImages.length > 0 && (
            <p className="mt-6 text-center text-xs text-neutral-400">
              * Images from Shutterstock — clicking opens Shutterstock for licensing.
            </p>
          )}
        </div>
      )}

      <FreeStockSection countryName={countryName} />

      <PartnerLinks countryName={countryName} />
    </>
  );
}
