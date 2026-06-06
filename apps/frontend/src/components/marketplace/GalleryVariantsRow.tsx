'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Crown } from 'lucide-react';

interface GalleryVariant {
  id: string;
  productSlug: string;
  name: string;
  thumbnail: string;
  isPremiumDesign?: boolean;
  type?: string;
}

interface ApiResponse {
  variants?: GalleryVariant[];
}

export function GalleryVariantsRow({
  countrySlug,
  currentProductSlug,
  countryName,
  galleryHref,
}: {
  countrySlug: string;
  currentProductSlug: string;
  countryName: string;
  galleryHref: string;
}) {
  const [variants, setVariants] = useState<GalleryVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countrySlug) return;
    let cancelled = false;

    fetch(`/api/gallery/country/${encodeURIComponent(countrySlug)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? (r.json() as Promise<ApiResponse>) : null))
      .then((data) => {
        if (cancelled || !data?.variants) return;
        setVariants(
          data.variants
            .filter((v) => v.productSlug !== currentProductSlug)
            .slice(0, 14),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countrySlug, currentProductSlug]);

  if (loading || variants.length === 0) return null;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      aria-label={`More ${countryName} flags`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Same country
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-slate-800">
            More {countryName} flags
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {variants.length}
          </span>
          <Link
            href={galleryHref}
            className="text-xs font-semibold text-[#2563eb] underline-offset-2 hover:underline"
          >
            See all
          </Link>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div
        className="-mx-0 flex gap-3 overflow-x-auto px-5 py-4 pb-5 [scrollbar-width:thin]"
        role="list"
        aria-label="Other flag designs"
      >
        {variants.map((v) => (
          <Link
            key={v.id}
            href={`/assets/${encodeURIComponent(v.productSlug)}`}
            role="listitem"
            title={v.name}
            className="group w-[9rem] shrink-0 text-left"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200 transition-all group-hover:ring-[#2563eb]/50 group-hover:shadow-md">
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.thumbnail}
                  alt=""
                  className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.06]"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  —
                </div>
              )}
              {/* Premium badge */}
              {v.isPremiumDesign ? (
                <span className="pointer-events-none absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-violet-600/90 px-[5px] py-0.5 text-[9px] font-bold uppercase text-white">
                  <Crown size={8} aria-hidden />
                  Pro
                </span>
              ) : (
                <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-emerald-500/85 px-[5px] py-0.5 text-[9px] font-bold uppercase text-white">
                  Free
                </span>
              )}
            </div>
          </Link>
        ))}

        {/* See all arrow card */}
        <Link
          href={galleryHref}
          className="group flex w-[5rem] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center transition hover:border-[#2563eb]/40 hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb]/10 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
            <ArrowRight size={16} aria-hidden />
          </div>
          <p className="text-[10px] font-semibold text-slate-500 group-hover:text-[#2563eb]">
            View all
          </p>
        </Link>
      </div>
    </section>
  );
}
