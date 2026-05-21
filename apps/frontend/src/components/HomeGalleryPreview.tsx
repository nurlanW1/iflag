'use client';

import { useState, useEffect, useMemo } from 'react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import GalleryGrid from './GalleryGrid';

interface Country {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
}

const PREVIEW_COUNT = 24;

type HomeGalleryPreviewProps = {
  /** Matches alternating editorial rails */
  surface?: 'white' | 'mist';
};

export default function HomeGalleryPreview({ surface = 'white' }: HomeGalleryPreviewProps) {
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const previewRes = await fetch('/api/gallery/landing-preview?full=1', {
        cache: 'no-store',
      });
      if (previewRes.ok) {
        const data = await previewRes.json();
        const list = data.countries || [];
        if (list.length > 0) {
          setAllCountries(list);
          return;
        }
      }

      const stockRes = await fetch('/api/gallery/countries', { cache: 'no-store' });
      if (stockRes.ok) {
        const data = await stockRes.json();
        setAllCountries(data.countries || []);
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayCountries = useMemo(() => {
    if (expanded || allCountries.length <= PREVIEW_COUNT) return allCountries;
    return allCountries.slice(0, PREVIEW_COUNT);
  }, [allCountries, expanded]);

  const handleShowMore = () => {
    setExpanded(true);
  };

  const bgClass = surface === 'mist' ? 'bg-[#fafaf9]' : 'bg-white';

  if (loading) {
    return (
      <section className={`${bgClass} py-16 md:py-24 lg:py-28`}>
        <div className="marketplace-shell">
          <div className="flex justify-center items-center py-20">
            <div className="h-11 w-11 animate-spin rounded-full border-2 border-neutral-200 border-t-[var(--brand-blue)]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative border-t border-neutral-200/80 ${bgClass} py-16 md:py-24 lg:py-28`}>
      <div className="marketplace-shell">
        {/* Section Header */}
        <SectionReveal
          hidden={{ opacity: 0, y: 12 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-12 md:mb-14 lg:mb-16"
        >
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
            Trending countries
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
            Editorial hubs updated from the gallery — tap through to territory-specific collections.
          </p>
        </SectionReveal>

        {/* Gallery Grid with optional fade when collapsed */}
        <div className="relative">
          {!expanded && allCountries.length > PREVIEW_COUNT && (
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40"
              style={{
                background:
                  surface === 'mist'
                    ? 'linear-gradient(to bottom, rgba(250,250,249,0) 0%, rgba(250,250,249,0.72) 45%, rgba(250,250,249,0.94) 72%, rgb(250,250,249) 100%)'
                    : 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 42%, rgba(255,255,255,0.92) 72%, rgb(255,255,255) 100%)',
              }}
            />
          )}

          <div className={expanded || allCountries.length <= PREVIEW_COUNT ? '' : 'overflow-hidden'}>
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-[0_14px_48px_-32px_rgba(42,52,65,0.14)] sm:p-4 md:p-5 lg:rounded-[1.35rem]">
              <GalleryGrid
                countries={displayCountries}
                disableScrollReveal
                largeTiles
                linkToCountryGallery
              />
            </div>
          </div>
        </div>

        <SectionReveal
          hidden={{ opacity: 0, y: 20 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex justify-center md:mt-12"
        >
          {!expanded && allCountries.length > PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={handleShowMore}
              className="rounded-lg border border-neutral-300 bg-white px-8 py-3 text-base font-medium text-[#2a2a2a] shadow-sm transition-colors duration-200 hover:border-neutral-400 hover:bg-neutral-50 md:px-10 md:py-3.5"
            >
              Show more countries
            </button>
          ) : expanded && allCountries.length > PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-lg border border-transparent px-8 py-3 text-base font-medium text-neutral-600 underline-offset-4 transition-colors hover:text-[#2a2a2a] hover:underline md:px-10 md:py-3.5"
            >
              Show less
            </button>
          ) : null}
        </SectionReveal>
      </div>
    </section>
  );
}
