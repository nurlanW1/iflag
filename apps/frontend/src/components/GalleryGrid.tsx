'use client';

import { motion } from 'framer-motion';
import { hasFlag } from 'country-flag-icons';
import FlagCssIcon from '@/components/FlagCssIcon';
import { useRevealInView } from '@/hooks/useRevealInView';

interface Country {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
}

interface GalleryGridProps {
  countries: Country[];
  /** Skip scroll-triggered reveal — avoids empty-looking grid when IntersectionObserver never fires. */
  disableScrollReveal?: boolean;
  /** Use thumbnail image URLs (reliable previews); set on home landing section. */
  preferImageThumbnails?: boolean;
  /** Fewer columns per row so each flag tile is larger (home landing). */
  largeTiles?: boolean;
}

function GalleryCell({
  country,
  idx,
  disableScrollReveal,
  preferImageThumbnails,
  largeTiles,
}: {
  country: Country;
  idx: number;
  disableScrollReveal?: boolean;
  preferImageThumbnails?: boolean;
  largeTiles?: boolean;
}) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>();
  const visible = disableScrollReveal || isRevealed;
  const useImg =
    preferImageThumbnails || !country.code || !hasFlag(country.code);

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: disableScrollReveal ? 0 : idx * 0.02 }}
      className="group"
    >
      <div
        className={
          largeTiles
            ? 'aspect-square min-h-0 rounded-xl sm:rounded-2xl bg-[#006d7a]/5 overflow-hidden border-2 border-[#006d7a]/15 hover:border-[#009ab6] hover:shadow-lg transition-all duration-300 flex items-center justify-center p-2 sm:p-3 md:p-4'
            : 'aspect-square bg-[#006d7a]/5 rounded-lg overflow-hidden border border-[#006d7a]/10 hover:border-[#009ab6] hover:shadow-md transition-all duration-300 flex items-center justify-center p-2'
        }
      >
        {useImg ? (
          <img
            src={country.thumbnail}
            alt={`${country.name} flag`}
            className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-flag.jpg';
            }}
          />
        ) : (
          <FlagCssIcon
            code={country.code}
            className="h-full w-full group-hover:scale-110 transition-transform duration-300"
          />
        )}
      </div>
      <p
        className={
          largeTiles
            ? 'text-sm sm:text-base font-medium text-black/70 text-center mt-2 sm:mt-3 truncate px-1'
            : 'text-xs md:text-sm font-medium text-black/70 text-center mt-2 truncate px-1'
        }
      >
        {country.name}
      </p>
    </motion.div>
  );
}

export default function GalleryGrid({
  countries,
  disableScrollReveal = false,
  preferImageThumbnails = false,
  largeTiles = false,
}: GalleryGridProps) {
  const gridClassName = largeTiles
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 sm:gap-6 md:gap-8 lg:gap-10'
    : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6';

  return (
    <div className={gridClassName}>
      {countries.map((country, idx) => (
        <GalleryCell
          key={country.code ? `${country.code}-${country.slug}` : country.slug}
          country={country}
          idx={idx}
          disableScrollReveal={disableScrollReveal}
          preferImageThumbnails={preferImageThumbnails}
          largeTiles={largeTiles}
        />
      ))}
    </div>
  );
}
