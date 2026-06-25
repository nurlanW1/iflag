'use client';

import { useState, useEffect, useMemo } from 'react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import GalleryGrid from './GalleryGrid';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';

const PREVIEW_COUNT = 36;

export default function HomeGalleryPreview() {
  const [allCountries, setAllCountries] = useState<GalleryCountrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const res = await fetch('/api/gallery/landing-preview', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
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
      <section className="bg-[#fafaf9] py-20 md:py-28 lg:py-32">
        <div className="marketplace-shell">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-200 border-t-[var(--brand-blue)]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[#fafaf9] py-20 md:py-28 lg:py-32">
      <div className="marketplace-shell">
        {/* Section Header */}
        <SectionReveal
          hidden={{ opacity: 0, y: 20 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-16 lg:mb-20"
        >
          <h2 className="mx-auto mb-4 max-w-4xl text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:mb-5 sm:text-4xl md:text-5xl lg:text-[2.75rem]">
            Popular countries
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-neutral-500 sm:text-lg">
            Dive into curated country hubs — previews update from the gallery API.
          </p>
        </SectionReveal>

        {/* Gallery Grid with optional fade when collapsed */}
        <div className="relative">
          {!expanded && allCountries.length > PREVIEW_COUNT && (
            <div
              className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(250,250,249,0) 0%, rgba(250,250,249,0.6) 40%, rgba(250,250,249,0.95) 80%, rgba(250,250,249,1) 100%)',
              }}
            />
          )}

          <div className={expanded || allCountries.length <= PREVIEW_COUNT ? '' : 'overflow-hidden'}>
            <div className="rounded-[1.25rem] border border-[#1e40af]/12 bg-[#f5fafb] p-3 shadow-[0_10px_30px_-14px_rgba(0,109,122,0.18)] sm:p-4">
              <GalleryGrid
                countries={displayCountries}
                disableScrollReveal
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
              className="rounded-xl border border-neutral-200 bg-white px-8 py-3 text-sm font-semibold text-[#2a2a2a] shadow-sm transition-all hover:border-[var(--brand-blue)]/40 hover:bg-[var(--brand-blue-soft)] hover:text-[var(--brand-blue)] hover:shadow-md"
            >
              Show more
            </button>
          ) : expanded && allCountries.length > PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-xl border border-neutral-200 bg-white px-8 py-3 text-sm font-semibold text-neutral-500 shadow-sm transition-all hover:bg-neutral-50"
            >
              Show less
            </button>
          ) : null}
        </SectionReveal>
      </div>
    </section>
  );
}
