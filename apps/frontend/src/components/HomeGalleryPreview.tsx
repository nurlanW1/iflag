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

export default function HomeGalleryPreview() {
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

  if (loading) {
    return (
      <section className="border-t border-neutral-200/90 bg-white py-16 md:py-20 lg:py-24">
        <div className="marketplace-shell">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009ab6]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative border-t border-neutral-200/90 bg-white py-16 md:py-20 lg:py-24">
      <div className="marketplace-shell">
        {/* Section Header */}
        <SectionReveal
          hidden={{ opacity: 0, y: 20 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-14"
        >
          <h2 className="mx-auto mb-4 max-w-4xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-[2rem] lg:text-[2.25rem]">
            Popular countries
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
            Editorial hubs powered by Neon — tap a tile to preview formats and downloads inside the gallery.
          </p>
        </SectionReveal>

        {/* Gallery Grid with optional fade when collapsed */}
        <div className="relative">
          {!expanded && allCountries.length > PREVIEW_COUNT && (
            <div
              className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.9) 70%, rgba(255, 255, 255, 1) 100%)',
              }}
            />
          )}

          <div className={expanded || allCountries.length <= PREVIEW_COUNT ? '' : 'overflow-hidden'}>
            <div className="rounded-2xl border border-neutral-200/95 bg-neutral-50/90 p-4 shadow-[0_18px_48px_-20px_rgba(15,23,42,0.14)] sm:p-5 md:rounded-[1.65rem] md:p-6">
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
              className="min-h-14 rounded-xl border-2 border-[#009ab6] px-12 py-4 text-base font-semibold text-[#009ab6] transition-all duration-300 hover:bg-[#009ab6] hover:text-white hover:shadow-lg md:text-lg"
            >
              Show more
            </button>
          ) : expanded && allCountries.length > PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="min-h-14 rounded-xl border border-neutral-300 px-12 py-4 text-base font-semibold text-neutral-700 transition hover:border-[#009ab6]/40 hover:text-neutral-950 md:text-lg"
            >
              Show less
            </button>
          ) : null}
        </SectionReveal>
      </div>
    </section>
  );
}
