'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FlagVideoPreview } from '@/components/media/FlagVideoPreview';
import type { FlagVideoSummary } from '@/types/flag-video-gallery';
import { marketplaceProductCardGridClasses } from '@/lib/ui/marketplace-layout';

type Props = {
  videos: FlagVideoSummary[];
};

export function FlagVideoGalleryGrid({ videos }: Props) {
  const playable = videos.filter((v) => v.videoUrl.trim().length > 0);

  if (!playable.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-14 text-center text-stone-600">
        <p className="text-base font-medium text-stone-800">No flag videos published yet.</p>
        <p className="mt-2 text-sm text-stone-500">Upload MP4 files to R2 and run import — they appear here alphabetically.</p>
      </div>
    );
  }

  return (
    <div className={marketplaceProductCardGridClasses}>
      {playable.map((v, idx) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(idx, 10) * 0.02 }}
        >
          <Link
            href={`/assets/${encodeURIComponent(v.productSlug)}`}
            className="group block overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_4px_14px_-8px_rgba(15,23,42,0.14)] transition-all hover:-translate-y-0.5 hover:border-[#2563eb]/40 hover:shadow-[0_8px_22px_-10px_rgba(15,23,42,0.18)]"
          >
            <div className="relative aspect-video overflow-hidden bg-stone-900">
              <FlagVideoPreview
                src={v.videoUrl}
                title={v.title}
                poster={v.thumbnail}
                format={v.format}
                playOverlay
                hoverPreview
                className="absolute inset-0"
              />
              <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {v.format}
              </span>
              <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-md bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                Paid
              </span>
            </div>
            <div className="px-3 py-2.5">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">{v.title}</h3>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-500">
                {v.countryName}
                {v.countryCode ? ` · ${v.countryCode}` : ''}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
