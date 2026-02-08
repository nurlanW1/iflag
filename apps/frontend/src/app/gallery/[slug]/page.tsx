'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2, Heart, FileImage, FileType, Video, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { hasFlag } from 'country-flag-icons';
import { getCountryCode } from '@/lib/country-mapping';

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

interface Format {
  id: string;
  format: string;
  formatCode: string;
  category: 'vector' | 'raster' | 'video';
  file: string;
  url: string;
  size: string;
  dimensions: string;
}

interface Variant {
  id: string;
  name: string;
  type: string;
  thumbnail: string;
  formats: Format[];
}

interface CountryData {
  country: {
    name: string;
    slug: string;
    code?: string | null;
  };
  variants: Variant[];
}

export default function CountryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vector' | 'raster' | 'video'>('raster');
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      loadCountryData(params.slug as string);
    }
  }, [params.slug]);

  const loadCountryData = async (slug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gallery/country/${slug}`);
      if (response.ok) {
        const countryData = await response.json();
        setData(countryData);
        // Get country code for flag icon
        if (countryData.country?.code) {
          setCountryCode(countryData.country.code);
        } else if (countryData.country?.name) {
          setCountryCode(getCountryCode(countryData.country.name));
        }
        if (countryData.variants && countryData.variants.length > 0) {
          setSelectedVariant(countryData.variants[0]);
          if (countryData.variants[0].formats && countryData.variants[0].formats.length > 0) {
            setSelectedFormat(countryData.variants[0].formats[0]);
          }
        }
      } else {
        console.error('Failed to load country data');
      }
    } catch (error) {
      console.error('Error loading country data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: Format) => {
    setDownloading(format.id);
    try {
      // Fetch the image as blob to ensure proper download
      const response = await fetch(format.url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data?.country.name || 'flag'}-${format.formatCode}.${format.formatCode}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: try direct download
      try {
        const link = document.createElement('a');
        link.href = format.url;
        link.download = `${data?.country.name || 'flag'}-${format.formatCode}.${format.formatCode}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        alert('Download failed. Please try again.');
      }
    } finally {
      setDownloading(null);
    }
  };

  // Filter formats by active tab
  const filteredFormats = selectedVariant?.formats.filter(format => {
    if (activeTab === 'vector') return format.category === 'vector';
    if (activeTab === 'raster') return format.category === 'raster';
    if (activeTab === 'video') return format.category === 'video';
    return true;
  }) || [];

  // Count formats by category
  const formatCounts = {
    vector: selectedVariant?.formats.filter(f => f.category === 'vector').length || 0,
    raster: selectedVariant?.formats.filter(f => f.category === 'raster').length || 0,
    video: selectedVariant?.formats.filter(f => f.category === 'video').length || 0,
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009ab6]"></div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-black/60 text-lg mb-4">Country not found</p>
            <Link
              href="/gallery"
              className="text-[#009ab6] hover:text-[#007a8a] font-semibold"
            >
              Back to Gallery
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#006d7a]/5 border-b border-[#006d7a]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-black/60 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Gallery</span>
          </Link>
          <div className="flex items-center gap-4 mb-2">
            {countryCode && hasFlag(countryCode) && (
              <div className="w-16 h-12 flex-shrink-0">
                <FlagIcon code={countryCode} className="w-full h-full object-contain" />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-black">
              {data.country.name} Flags
            </h1>
          </div>
          <p className="text-black/60">
            {data.variants.length} {data.variants.length === 1 ? 'variant' : 'variants'} available
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Preview and Variants */}
          <div className="lg:col-span-2">
            {/* Main Preview */}
            {selectedVariant && selectedFormat && (
              <div className="bg-white border-2 border-[#006d7a]/10 rounded-xl overflow-hidden mb-6">
                <div className="aspect-video bg-[#006d7a]/5 relative flex items-center justify-center p-8">
                  <img
                    src={selectedFormat.url}
                    alt={`${data.country.name} ${selectedVariant.name}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = selectedVariant.thumbnail;
                    }}
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-black mb-2">{selectedVariant.name}</h2>
                  <p className="text-black/60 mb-4">Select a format below to download</p>
                  {/* Direct Download Button */}
                  <button
                    onClick={() => handleDownload(selectedFormat)}
                    disabled={downloading === selectedFormat.id}
                    className="w-full px-6 py-3 bg-[#009ab6] hover:bg-[#007a8a] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {downloading === selectedFormat.id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        <span>Download {selectedFormat.format}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* All Flags Grid - Show all JPG images */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Available Flags ({data.variants.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {data.variants.map((variant) => {
                  const format = variant.formats?.[0];
                  return (
                    <div
                      key={variant.id}
                      className={`group relative bg-white border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                        selectedVariant?.id === variant.id
                          ? 'border-[#009ab6] shadow-lg'
                          : 'border-[#006d7a]/10 hover:border-[#009ab6] hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedVariant(variant);
                        if (variant.formats && variant.formats.length > 0) {
                          setSelectedFormat(variant.formats[0]);
                        }
                      }}
                    >
                      <div className="aspect-video bg-[#006d7a]/5 relative overflow-hidden">
                        {format ? (
                          <img
                            src={format.url}
                            alt={variant.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = variant.thumbnail;
                            }}
                          />
                        ) : (
                          <img
                            src={variant.thumbnail}
                            alt={variant.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        )}
                        {/* Download overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <Download size={20} className="text-[#009ab6]" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-black text-center truncate">{variant.name}</p>
                        {format && (
                          <p className="text-xs text-black/60 text-center mt-1">{format.format}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Formats */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-[#006d7a]/10 rounded-xl p-6 sticky top-8">
              <h3 className="text-xl font-bold text-black mb-4">Download Formats</h3>
              
              {/* Format Tabs */}
              <div className="flex gap-2 mb-4 border-b border-[#006d7a]/10">
                {formatCounts.vector > 0 && (
                  <button
                    onClick={() => setActiveTab('vector')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'vector'
                        ? 'text-[#009ab6] border-b-2 border-[#009ab6]'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    <FileType size={16} className="inline mr-1" />
                    Vector ({formatCounts.vector})
                  </button>
                )}
                {formatCounts.raster > 0 && (
                  <button
                    onClick={() => setActiveTab('raster')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'raster'
                        ? 'text-[#009ab6] border-b-2 border-[#009ab6]'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    <FileImage size={16} className="inline mr-1" />
                    Raster ({formatCounts.raster})
                  </button>
                )}
                {formatCounts.video > 0 && (
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'video'
                        ? 'text-[#009ab6] border-b-2 border-[#009ab6]'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    <Video size={16} className="inline mr-1" />
                    Video ({formatCounts.video})
                  </button>
                )}
              </div>

              {/* Formats List */}
              <div className="space-y-3">
                {filteredFormats.length === 0 ? (
                  <p className="text-black/60 text-sm text-center py-4">
                    No {activeTab} formats available
                  </p>
                ) : (
                  filteredFormats.map((format) => (
                    <div
                      key={format.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedFormat?.id === format.id
                          ? 'border-[#009ab6] bg-[#009ab6]/5'
                          : 'border-[#006d7a]/10 hover:border-[#009ab6]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-black">{format.format}</p>
                          <p className="text-xs text-black/60">
                            {format.dimensions} • {format.size}
                          </p>
                        </div>
                        {selectedFormat?.id === format.id && (
                          <Check size={20} className="text-[#009ab6]" />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFormat(format);
                          handleDownload(format);
                        }}
                        disabled={downloading === format.id}
                        className="w-full px-4 py-2 bg-[#009ab6] hover:bg-[#007a8a] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {downloading === format.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download size={16} />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
