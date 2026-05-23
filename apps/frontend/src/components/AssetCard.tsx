'use client';

import Link from 'next/link';
import { Crown, Download, Eye, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { FlagProtectedPreview } from '@/components/brand/FlagProtectedPreview';

interface AssetCardProps {
  asset: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url?: string;
    is_premium?: boolean;
    asset_type?: string;
    views?: number;
    downloads?: number;
  };
  index?: number;
}

export default function AssetCard({ asset, index = 0 }: AssetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      <Link href={`/assets/${asset.slug}`} className="block">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/10">
          {/* Image Container */}
          <div className="aspect-[4/3] bg-black/5 relative overflow-hidden">
            {asset.thumbnail_url ? (
              <FlagProtectedPreview className="absolute inset-0">
                <img
                  src={asset.thumbnail_url}
                  alt={asset.title}
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </FlagProtectedPreview>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/30">
                <div className="text-center">
                  <div className="w-16 h-16 bg-black/10 rounded-lg mx-auto mb-2"></div>
                  <p className="text-sm">No preview</p>
                </div>
              </div>
            )}

            <div
              className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg bg-amber-400/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-amber-950 shadow-sm ring-1 ring-amber-600/35 backdrop-blur-[2px] sm:text-xs"
              title="Premium stock"
            >
              <Crown size={12} className="shrink-0 sm:h-[13px] sm:w-[13px]" aria-hidden strokeWidth={2.25} />
              Premium
            </div>

            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-4">
                    {asset.views !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        <span>{asset.views.toLocaleString()}</span>
                      </div>
                    )}
                    {asset.downloads !== undefined && (
                      <div className="flex items-center gap-1">
                        <Download size={14} />
                        <span>{asset.downloads.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle favorite
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors">
                <Eye size={18} />
              </button>
            </div>
          </div>

          {/* Card Footer */}
          <div className="p-4">
            <h3 className="text-black font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[#2563eb] transition-colors">
              {asset.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-black/60 text-xs uppercase">{asset.asset_type || 'Flag'}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                <Crown size={12} className="shrink-0 text-amber-700" aria-hidden strokeWidth={2.25} />
                Premium
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
