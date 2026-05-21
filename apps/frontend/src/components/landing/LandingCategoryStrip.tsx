'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import type { Category } from '@/types/marketplace';

export function LandingCategoryStrip() {
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/marketplace/categories');
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) setCats((json.data as Category[]) ?? []);
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const approvedCats = useMemo(() => cats.filter((c) => c.isApproved).slice(0, 18), [cats]);

  return (
    <section
      id="catalog-categories"
      className="scroll-mt-[calc(var(--header-height)+16px)] border-t border-neutral-200/90 bg-neutral-50/95 py-16 md:py-20 lg:py-24"
      aria-labelledby="categories-strip-heading"
    >
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 12 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-12 text-center"
        >
          <h2
            id="categories-strip-heading"
            className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]"
          >
            Categories
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
            Jump into a curated rail or open the full catalog — vector-first workflows supported across regions.
          </p>
        </SectionReveal>

        <div className="-mx-1 flex flex-wrap justify-center gap-3 pb-1 sm:gap-4">
          <Link
            href="/browse"
            className="inline-flex min-h-14 items-center rounded-xl bg-[#3d4f61] px-10 py-3 text-base font-semibold text-[#fafaf9] shadow-sm transition-colors hover:bg-[#354558]"
          >
            Browse all
          </Link>
          <Link
            href="/gallery"
            className="inline-flex min-h-14 items-center rounded-xl border border-neutral-300 bg-white px-10 py-3 text-base font-semibold text-[#2a2a2a] shadow-sm transition-colors hover:border-neutral-400 hover:bg-neutral-50"
          >
            Country gallery
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-14 items-center rounded-xl border border-neutral-300 bg-white px-10 py-3 text-base font-semibold text-[#2a2a2a] shadow-sm transition-colors hover:border-neutral-400 hover:bg-neutral-50"
            title="Paddle checkout"
          >
            Licenses &amp; pricing
          </Link>
          {approvedCats.map((c) => (
            <Link
              key={c.id}
              href={`/browse?category=${encodeURIComponent(c.slug)}`}
              className="inline-flex min-h-14 items-center rounded-xl border border-neutral-200 bg-white px-8 py-3 text-base font-medium text-neutral-800 shadow-sm transition-colors hover:border-neutral-400 hover:text-[#2a2a2a]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
