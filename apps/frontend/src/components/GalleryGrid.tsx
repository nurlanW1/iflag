'use client';

import Link from 'next/link';
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
  /** Each tile links to `/gallery/[slug]` (e.g. landing “folder” → gallery country page). */
  linkToCountryGallery?: boolean;
}

function GalleryCell({
  country,
  idx,
  disableScrollReveal,
  preferImageThumbnails,
  largeTiles,
  linkToCountryGallery,
}: {
  country: Country;
  idx: number;
  disableScrollReveal?: boolean;
  preferImageThumbnails?: boolean;
  largeTiles?: boolean;
  linkToCountryGallery?: boolean;
}) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>();
  const visible = disableScrollReveal || isRevealed;
  const useImg =
    preferImageThumbnails || !country.code || !hasFlag(country.code);

  const tile = (
    <>
      <div
        className={
          largeTiles
            ? 'aspect-square min-h-0 rounded-xl sm:rounded-2xl bg-[#006d7a]/5 overflow-hidden border-2 border-[#006d7a]/15 hover:border-[#009ab6] hover:shadow-lg transition-all duration-300 flex items-center justify-center p-1.5 sm:p-2.5 md:p-3'
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
            ? 'text-sm sm:text-base md:text-lg font-medium text-black/70 text-center mt-2 sm:mt-3 truncate px-1'
            : 'text-xs md:text-sm font-medium text-black/70 text-center mt-2 truncate px-1'
        }
      >
        {country.name}
      </p>
    </>
  );

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: disableScrollReveal ? 0 : idx * 0.02 }}
      className="group"
    >
      {linkToCountryGallery ? (
        <Link
          href={`/gallery/${country.slug}`}
          className="block cursor-pointer text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009ab6] focus-visible:ring-offset-2 rounded-xl"
        >
          {tile}
        </Link>
      ) : (
        tile
      )}
    </motion.div>
  );
}

export default function GalleryGrid({
  countries,
  disableScrollReveal = false,
  preferImageThumbnails = false,
  largeTiles = false,
  linkToCountryGallery = false,
}: GalleryGridProps) {
  const gridClassName = largeTiles
    ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-7 sm:gap-9 md:gap-11 lg:gap-12 xl:gap-14'
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
          linkToCountryGallery={linkToCountryGallery}
        />
      ))}
    </div>
  );
}
