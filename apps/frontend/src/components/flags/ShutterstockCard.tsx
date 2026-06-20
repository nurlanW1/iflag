'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Crown } from 'lucide-react';

interface ShutterstockCardProps {
  id: string;
  thumbUrl: string;
  description: string;
  shutterUrl?: string;
  sourceUrl?: string;
  source?: 'shutterstock' | 'pixabay' | 'pexels';
  licenseType?: 'free' | 'paid';
  mediaType?: string;
}

const SOURCE_LABELS = {
  shutterstock: 'Shutterstock',
  pixabay: 'Pixabay',
  pexels: 'Pexels',
} as const;

export function ShutterstockCard({
  thumbUrl,
  description,
  shutterUrl,
  sourceUrl,
  source = 'shutterstock',
  licenseType = source === 'shutterstock' ? 'paid' : 'free',
  mediaType,
}: ShutterstockCardProps) {
  const [imgError, setImgError] = useState(false);
  const sourceLabel = SOURCE_LABELS[source] ?? SOURCE_LABELS.shutterstock;
  const href = shutterUrl || sourceUrl || '#';
  const isPremium = licenseType === 'paid' || source === 'shutterstock';
  const tierLabel = isPremium ? 'Premium' : 'Free';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-neutral-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <span
          className={clsx(
            'pointer-events-none absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_1px_4px_rgba(15,23,42,0.18)] ring-1 ring-black/10',
            isPremium ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-white',
          )}
          title={tierLabel}
        >
          <Crown className="h-4 w-4 shrink-0" strokeWidth={2.35} aria-hidden />
          <span className="sr-only">{tierLabel} stock image</span>
        </span>

        {!imgError && thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={description || 'Stock flag image'}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-50 text-neutral-300">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.25" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.25" />
              <circle cx="17" cy="8" r="1" fill="currentColor" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 flex items-end justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/25">
          <span className="mb-3 translate-y-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-bold text-neutral-900 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            Open original
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-2 text-[0.875rem] font-medium leading-snug text-[#2a2a2a]">
          {description || 'Flag stock photo'}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            {tierLabel}
          </p>
          <span
            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500"
            title={sourceLabel}
          >
            {mediaType || licenseType}
          </span>
        </div>
      </div>
    </a>
  );
}
