'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Folder, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { hasFlag } from 'country-flag-icons';

interface Country {
  name: string;
  slug: string;
  code: string | null;
  count: number;
  thumbnail: string;
}

// Flag Icon Component - using SVG from CDN
function FlagIcon({ code, className }: { code: string | null; className?: string }) {
  if (!code || !hasFlag(code)) {
    return null;
  }

  // Use CDN URL for flag icons
  return (
    <img
      src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`}
      alt={`${code} flag`}
      className={className}
      loading="lazy"
    />
  );
}

export default function GalleryPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gallery/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    
    const query = searchQuery.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-[#006d7a]/5 border-b border-[#006d7a]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-2">
            Flag Gallery
          </h1>
          <p className="text-black/60 text-lg mb-6">
            Browse flags by country - {countries.length} countries available
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl">
            <form 
              onSubmit={(e) => { e.preventDefault(); }} 
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/40" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#006d7a]/10 rounded-lg text-black placeholder-black/40 focus:outline-none focus:border-[#009ab6] transition-colors"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-black/60 text-sm">
            {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Countries Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009ab6]"></div>
          </div>
        ) : filteredCountries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-black/60 text-lg mb-4">No countries found</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#009ab6] hover:text-[#007a8a] font-semibold"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredCountries.map((country, idx) => (
              <motion.div
                key={country.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
              >
                <Link
                  href={`/gallery/${country.slug}`}
                  className="group block bg-white rounded-xl border-2 border-[#006d7a]/10 hover:border-[#009ab6] hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-[#006d7a]/5 relative overflow-hidden flex items-center justify-center">
                    {country.code && hasFlag(country.code) ? (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <FlagIcon code={country.code} className="w-full h-full object-contain" />
                      </div>
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
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={24} className="text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Country Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Folder size={16} className="text-[#009ab6] flex-shrink-0" />
                      <h3 className="text-sm font-bold text-black truncate">{country.name}</h3>
                    </div>
                    <p className="text-xs text-black/60">
                      {country.count} {country.count === 1 ? 'flag' : 'flags'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
