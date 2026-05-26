'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRevealInView } from '@/hooks/useRevealInView';
import { CountryHubFolderCover } from '@/components/gallery/CountryHubFolderCover';
import type { GalleryCountrySummary } from '@/types/gallery-country-hub';
import { galleryCompactTileGridClasses, galleryHomeLargeTileGridClasses } from '@/lib/ui/marketplace-layout';

type Country = GalleryCountrySummary;

interface GalleryGridProps {
  countries: Country[];
  disableScrollReveal?: boolean;
  preferImageThumbnails?: boolean;
  largeTiles?: boolean;
  linkToCountryGallery?: boolean;
}

function GalleryCell({
  country,
  idx,
  disableScrollReveal,
  largeTiles,
  linkToCountryGallery,
}: {
  country: Country;
  idx: number;
  disableScrollReveal?: boolean;
  largeTiles?: boolean;
  linkToCountryGallery?: boolean;
}) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>();
  const visible = disableScrollReveal || isRevealed;

  const tile = (
    <>
      <div
        className={
          largeTiles
            ? 'relative aspect-square min-h-0 rounded-xl sm:rounded-2xl bg-[#1e40af]/5 overflow-hidden border-2 border-[#1e40af]/15 hover:border-[#2563eb] hover:shadow-lg transition-all duration-300'
            : 'relative aspect-square bg-[#1e40af]/5 rounded-lg overflow-hidden border border-[#1e40af]/10 hover:border-[#2563eb] hover:shadow-md transition-all duration-300'
        }
      >
        <CountryHubFolderCover
          countryName={country.name}
          coverUrl={country.webp_cover_url ?? country.thumbnail}
          hasWebpCover={country.has_webp_cover}
          imageClassName="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
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
          className="block cursor-pointer text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 rounded-xl"
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
  largeTiles = false,
  linkToCountryGallery = false,
}: GalleryGridProps) {
  const gridClassName = largeTiles ? galleryHomeLargeTileGridClasses : galleryCompactTileGridClasses;

  return (
    <div className={gridClassName}>
      {countries.map((country, idx) => (
        <GalleryCell
          key={country.code ? `${country.code}-${country.slug}` : country.slug}
          country={country}
          idx={idx}
          disableScrollReveal={disableScrollReveal}
          largeTiles={largeTiles}
          linkToCountryGallery={linkToCountryGallery}
        />
      ))}
    </div>
  );
}
