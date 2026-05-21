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
    <section className="border-t border-gray-100 bg-gray-50/90 py-16 md:py-20 lg:py-24" aria-labelledby="categories-strip-heading">
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 12 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-center"
        >
          <h2 id="categories-strip-heading" className="text-3xl font-black text-gray-950 sm:text-4xl lg:text-[2.125rem]">
            Categories
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base text-gray-600 sm:text-lg">
            Jump into a collection or open the full catalog with one tap.
          </p>
        </SectionReveal>

        <div className="-mx-1 flex flex-wrap justify-center gap-3 pb-1 sm:gap-3.5">
          <Link
            href="/browse"
            className="inline-flex min-h-[3rem] items-center rounded-xl bg-gray-950 px-8 py-2.5 text-base font-semibold text-white shadow-md transition hover:bg-[#009ab6]"
          >
            Browse all
          </Link>
          <Link
            href="/gallery"
            className="inline-flex min-h-[3rem] items-center rounded-xl border-2 border-gray-200 bg-white px-8 py-2.5 text-base font-semibold text-gray-900 transition hover:border-[#009ab6]"
          >
            Country gallery
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[3rem] items-center rounded-xl border-2 border-gray-200 bg-white px-8 py-2.5 text-base font-semibold text-gray-900 transition hover:border-[#009ab6]"
            title="Paddle checkout"
          >
            Licenses &amp; pricing
          </Link>
          {approvedCats.map((c) => (
            <Link
              key={c.id}
              href={`/browse?category=${encodeURIComponent(c.slug)}`}
              className="inline-flex min-h-[3rem] items-center rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-base font-medium text-gray-800 shadow-sm transition hover:border-[#009ab6] hover:text-[#009ab6]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
