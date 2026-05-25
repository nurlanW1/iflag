'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

const GRID_LIMIT = 12;

type CountryHubTile = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  design_count: number;
  file_count: number;
};

function shufflePick<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

async function fetchRandomCountryCovers(limit: number): Promise<CountryHubTile[]> {
  const res = await fetch('/api/gallery/countries', { cache: 'no-store' });
  if (!res.ok) return [];
  const j = (await res.json()) as {
    countries?: Array<{
      id: string;
      name: string;
      slug: string;
      thumbnail?: string | null;
      thumbnail_url?: string | null;
      count?: number;
      flag_count?: number;
      design_count?: number;
    }>;
  };
  const list = j.countries ?? [];
  const withThumb = list.filter((c) => String(c.thumbnail || c.thumbnail_url || '').trim());
  const picked = shufflePick(withThumb, limit);
  return picked.map((co) => {
    const imageUrl = (co.thumbnail || co.thumbnail_url)!.trim();
    const files = typeof co.flag_count === 'number' ? co.flag_count : Number(co.count ?? 0);
    const designs =
      typeof co.design_count === 'number' && Number.isFinite(co.design_count)
        ? co.design_count
        : files;
    return {
      id: co.id || `hub:${co.slug}`,
      name: co.name,
      slug: co.slug,
      image_url: imageUrl,
      design_count: designs,
      file_count: Number.isFinite(files) ? files : 0,
    };
  });
}

type ExplorePhase = 'loading' | { items: CountryHubTile[] } | 'empty';

export function LandingFlagGalleryPreview() {
  const [phase, setPhase] = useState<ExplorePhase>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchRandomCountryCovers(GRID_LIMIT);
        if (cancelled) return;
        if (rows.length > 0) {
          setPhase({ items: rows });
        } else {
          setPhase('empty');
        }
      } catch {
        if (!cancelled) setPhase('empty');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = phase === 'loading';
  const empty = phase === 'empty';
  const items = phase !== 'loading' && phase !== 'empty' ? phase.items : [];

  return (
    <section className="border-t border-neutral-200/85 bg-[#fafaf9] py-14 md:py-20 lg:py-24">
      <div className="marketplace-shell">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-white via-[#fafaf9] to-neutral-100/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6 md:p-8 lg:rounded-[1.35rem]">
          <div className="mb-8 rounded-xl bg-white/95 px-4 py-5 ring-1 ring-neutral-200/70 sm:mb-10 sm:px-6 sm:py-6">
            <SectionReveal
              hidden={{ opacity: 0, y: 10 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex max-w-3xl flex-col"
            >
              <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
                Explore Flag Assets
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
                Twelve random country folders — each hub groups every format into clean designs instead of noisy
                duplicates.
              </p>
            </SectionReveal>
          </div>

          {loading ? (
            <ul
              className="grid grid-cols-1 gap-3.5 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"
              aria-busy="true"
              aria-label="Loading country folders"
            >
              {Array.from({ length: GRID_LIMIT }).map((_, i) => (
                <li
                  key={i}
                  className="flex flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <div className="aspect-[5/4] animate-pulse bg-neutral-200/90 sm:aspect-[4/3]" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-[88%] max-w-[12rem] animate-pulse rounded bg-neutral-200/90" />
                    <div className="h-3 w-[62%] max-w-[9rem] animate-pulse rounded bg-neutral-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : empty ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center text-neutral-600 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-base font-medium text-neutral-800">No flag assets available yet.</p>
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 gap-3.5 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"
              role="list"
              aria-label="Random country folders"
            >
              {items.map((item) => {
                const href = `/countries/${encodeURIComponent(item.slug)}`;
                const svg = shouldUnoptimizeFlagImageHref(item.image_url, []);

                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-300 hover:border-neutral-300 hover:shadow-md"
                    >
                      <div className="relative aspect-[5/4] bg-neutral-100 sm:aspect-[4/3]">
                        <ProductPreviewImage className="absolute inset-0" watermarkEnabled protectEnabled>
                          <Image
                            src={item.image_url}
                            alt={`${item.name} — country folder`}
                            fill
                            loading="lazy"
                            unoptimized={svg}
                            draggable={false}
                            className="relative z-0 object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                            sizes="(max-width: 379px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
                          />
                        </ProductPreviewImage>
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-4">
                        <p className="text-[0.95rem] font-semibold leading-snug text-[#2a2a2a] md:text-base">
                          {item.name}
                        </p>
                        <p className="text-[0.75rem] font-medium uppercase tracking-wide text-neutral-500">
                          {item.design_count} design{item.design_count === 1 ? '' : 's'} ·{' '}
                          {item.file_count} file{item.file_count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && !empty ? (
            <div className="mt-10 flex justify-center md:mt-12">
              <Link
                href="/gallery"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--brand-blue)] px-10 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
              >
                Browse Gallery
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
