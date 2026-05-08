'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
      const stockRes = await fetch('/api/gallery/countries', { cache: 'no-store' });
      if (stockRes.ok) {
        const data = await stockRes.json();
        const list = data.countries || [];
        if (list.length > 0) {
          setAllCountries(list);
          return;
        }
      }

      const previewRes = await fetch('/api/gallery/landing-preview?full=1', {
        cache: 'no-store',
      });
      if (previewRes.ok) {
        const data = await previewRes.json();
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
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009ab6]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-4 bg-white relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <SectionReveal
          hidden={{ opacity: 0, y: 20 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Explore Our Flag Collection
          </h2>
          <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto">
            Browse through hundreds of high-quality country flags in various formats
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
            <GalleryGrid
              countries={displayCountries}
              disableScrollReveal
              preferImageThumbnails
              largeTiles
            />
          </div>
        </div>

        <SectionReveal
          hidden={{ opacity: 0, y: 20 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col items-center gap-4 md:mt-12"
        >
          {!expanded && allCountries.length > PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={handleShowMore}
              className="group relative px-8 py-3 md:px-12 md:py-4 border-2 border-[#009ab6] rounded-full text-[#009ab6] font-semibold text-base md:text-lg transition-all duration-300 hover:bg-[#009ab6] hover:text-white hover:shadow-lg hover:scale-105 active:scale-100"
            >
              <span className="relative z-10">Show More</span>
              <motion.div
                className="absolute inset-0 rounded-full bg-[#009ab6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
            </button>
          ) : expanded && allCountries.length > PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-8 py-3 md:px-12 md:py-4 border-2 border-[#006d7a]/20 rounded-full text-black/70 font-semibold text-base md:text-lg transition-all duration-300 hover:border-[#009ab6]/40 hover:text-black"
            >
              Show less
            </button>
          ) : null}
          <Link
            href="/gallery"
            className="text-[#009ab6] font-semibold text-base hover:text-[#007a8a] underline-offset-4 hover:underline"
          >
            Open full gallery
          </Link>
        </SectionReveal>
      </div>
    </section>
  );
}
