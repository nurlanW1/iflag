'use client';

import { motion } from 'framer-motion';
import { hasFlag } from 'country-flag-icons';

interface Country {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
}

interface GalleryGridProps {
  countries: Country[];
}

// Flag Icon Component - using SVG from CDN
function FlagIcon({ code, className }: { code: string | null; className?: string }) {
  if (!code || !hasFlag(code)) {
    return null;
  }

  return (
    <img
      src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`}
      alt={`${code} flag`}
      className={className}
      loading="lazy"
    />
  );
}

export default function GalleryGrid({ countries }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
      {countries.map((country, idx) => (
        <motion.div
          key={country.slug}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: idx * 0.02 }}
          className="group"
        >
          <div className="aspect-square bg-[#006d7a]/5 rounded-lg overflow-hidden border border-[#006d7a]/10 hover:border-[#009ab6] hover:shadow-md transition-all duration-300 flex items-center justify-center p-2">
            {country.code && hasFlag(country.code) ? (
              <FlagIcon 
                code={country.code} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
              />
            ) : (
              <img
                src={country.thumbnail}
                alt={`${country.name} flag`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-flag.jpg';
                }}
              />
            )}
          </div>
          <p className="text-xs md:text-sm font-medium text-black/70 text-center mt-2 truncate px-1">
            {country.name}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
