'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { hasFlag } from 'country-flag-icons';
import GalleryGrid from './GalleryGrid';

interface Country {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
}

export default function HomeGalleryPreview() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await fetch('/api/gallery/countries');
      if (response.ok) {
        const data = await response.json();
        // Take first 24 countries to ensure 3 rows on all screen sizes
        // Mobile: 3 per row × 3 rows = 9 (shows 9)
        // Tablet: 4-5 per row × 3 rows = 12-15 (shows 15)
        // Desktop: 6-8 per row × 3 rows = 18-24 (shows 24)
        setCountries((data.countries || []).slice(0, 24));
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMore = () => {
    router.push('/gallery');
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Explore Our Flag Collection
          </h2>
          <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto">
            Browse through hundreds of high-quality country flags in various formats
          </p>
        </motion.div>

        {/* Gallery Grid with Fade Effect */}
        <div className="relative">
          {/* Gradient Fade Mask */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.9) 70%, rgba(255, 255, 255, 1) 100%)',
            }}
          />
          
          {/* Gallery Grid - Limited to 3 rows, not scrollable */}
          <div className="overflow-hidden">
            <GalleryGrid countries={countries} />
          </div>
        </div>

        {/* Show More Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mt-8 md:mt-12"
        >
          <button
            onClick={handleShowMore}
            className="group relative px-8 py-3 md:px-12 md:py-4 border-2 border-[#009ab6] rounded-full text-[#009ab6] font-semibold text-base md:text-lg transition-all duration-300 hover:bg-[#009ab6] hover:text-white hover:shadow-lg hover:scale-105 active:scale-100"
          >
            <span className="relative z-10">Show More</span>
            <motion.div
              className="absolute inset-0 rounded-full bg-[#009ab6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
