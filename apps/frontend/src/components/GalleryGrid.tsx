'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRevealInView } from '@/hooks/useRevealInView';
import { FLAG_THUMB_PLACEHOLDER_DATA_URL } from '@/lib/flag-thumbnail-fallback';
import { galleryCompactTileGridClasses, galleryHomeLargeTileGridClasses } from '@/lib/ui/marketplace-layout';

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
  /** Kept for backward compatibility — uploaded thumbnails are now always used. */
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
  const src = country.thumbnail?.trim() || FLAG_THUMB_PLACEHOLDER_DATA_URL;

  const tile = (
    <>
      <div
        className={
          largeTiles
            ? 'aspect-square min-h-0 rounded-xl sm:rounded-2xl bg-[#1e40af]/5 overflow-hidden border-2 border-[#1e40af]/15 hover:border-[#2563eb] hover:shadow-lg transition-all duration-300 flex items-center justify-center p-1.5 sm:p-2.5 md:p-3'
            : 'aspect-square bg-[#1e40af]/5 rounded-lg overflow-hidden border border-[#1e40af]/10 hover:border-[#2563eb] hover:shadow-md transition-all duration-300 flex items-center justify-center p-2'
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic CDN / blob previews */}
        <img
          key={src}
          src={src}
          alt={`${country.name} flag`}
          className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
          decoding="async"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.onerror = null;
            el.src = FLAG_THUMB_PLACEHOLDER_DATA_URL;
          }}
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
