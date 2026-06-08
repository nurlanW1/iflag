'use client';

import Link from 'next/link';
import { Crown, Download } from 'lucide-react';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { shouldWatermarkFlagPreview } from '@/lib/gallery/flag-preview-watermark';

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
  const thumb = asset.thumbnail_url?.trim() || '';
  const isPremium = Boolean(asset.is_premium);
  const showWatermark = shouldWatermarkFlagPreview({ isPremiumDesign: isPremium });
  const isWebpThumb = Boolean(thumb?.includes('.webp'));

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
    >
      <Link href={`/assets/${asset.slug}`} className={`relative block aspect-[4/3] overflow-hidden ${isWebpThumb ? '' : 'bg-[#fafaf9]'}`}>
        {thumb ? (
          <ProductPreviewImage
            className="absolute inset-0"
            watermarkEnabled={showWatermark}
            protectEnabled
          >
            <img
              src={thumb}
              alt={asset.title}
              draggable={false}
              className="h-full w-full object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          </ProductPreviewImage>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3.5" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="17.5" cy="7.5" r="1" fill="#94a3b8" />
            </svg>
          </div>
        )}

        {/* Tier badge */}
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          {isPremium ? (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-600/35 backdrop-blur-[2px]"
              title="Paid design"
            >
              <Crown size={10} className="shrink-0" aria-hidden strokeWidth={2.5} />
              Paid
            </span>
          ) : (
            <span
              className="inline-flex items-center rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-emerald-600/30 backdrop-blur-[2px]"
              title="Free download"
            >
              Free
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {asset.asset_type ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {asset.asset_type}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-slate-900">
          <Link
            href={`/assets/${asset.slug}`}
            className="rounded hover:text-[var(--brand-blue)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
          >
            {asset.title}
          </Link>
        </h3>

        {(asset.downloads !== undefined) ? (
          <p className="mt-auto flex items-center gap-1.5 pt-2 text-[11px] text-slate-400">
            <Download size={11} aria-hidden />
            {asset.downloads.toLocaleString()} downloads
          </p>
        ) : (
          <div className="mt-auto pt-2">
            <Link
              href={`/assets/${asset.slug}`}
              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              View asset
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
