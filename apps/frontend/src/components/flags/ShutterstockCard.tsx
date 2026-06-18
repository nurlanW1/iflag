'use client';

import { useState } from 'react';

interface ShutterstockCardProps {
  id: string;
  thumbUrl: string;
  description: string;
  shutterUrl: string;
}

export function ShutterstockCard({ thumbUrl, description, shutterUrl }: ShutterstockCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={shutterUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-neutral-300 hover:shadow-md"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {/* SS badge — top-right, same style as "Video" badge */}
        <span className="absolute right-2 top-2 z-10 rounded-md bg-[#cc0000]/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          SS
        </span>

        {!imgError && thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={description || 'Stock flag image'}
            loading="lazy"
            decoding="async"
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

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/25">
          <span className="mb-3 translate-y-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-bold text-neutral-900 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            View on Shutterstock ↗
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-2 text-[0.875rem] font-medium leading-snug text-[#2a2a2a]">
          {description || 'Flag stock photo'}
        </p>
        <p className="mt-auto text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          shutterstock
        </p>
      </div>
    </a>
  );
}
