'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { visualsForCategoryKind } from '@/lib/marketplace/category-visuals';
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

  const approvedCats = useMemo(() => {
    return [...cats.filter((c) => c.isApproved)].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [cats]);

  return (
    <section
      id="catalog-categories"
      className="scroll-mt-[calc(var(--header-height)+12px)] border-t border-neutral-200/90 bg-gradient-to-b from-neutral-50 via-white to-neutral-50/80 py-12 sm:py-16 md:py-20 lg:py-24"
      aria-labelledby="categories-strip-heading"
    >
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 12 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 text-center sm:mb-10 md:mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)]">Catalog hubs</p>
          <h2
            id="categories-strip-heading"
            className="mt-2 text-balance px-2 text-2xl font-semibold tracking-tight text-[#2a2a2a] sm:mt-3 sm:text-[1.875rem] md:text-[2rem] lg:text-[2.125rem]"
          >
            Browse by category
          </h2>
        </SectionReveal>

        <div className="mb-8 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:mb-10 sm:snap-none sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 md:gap-3.5">
          <Link
            href="/gallery"
            className="inline-flex min-h-12 shrink-0 snap-start items-center justify-center rounded-xl bg-[var(--brand-blue)] px-5 py-3 text-center text-sm font-semibold text-[#fafaf9] shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)] sm:min-h-14 sm:w-auto sm:flex-1 sm:px-10 sm:text-base md:flex-initial md:min-w-[10.5rem]"
          >
            Country gallery
          </Link>
          <Link
            href="/gallery"
            className="inline-flex min-h-12 shrink-0 snap-start items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-center text-sm font-semibold text-[#2a2a2a] shadow-sm transition-colors hover:border-neutral-400 hover:bg-neutral-50 sm:min-h-14 sm:w-auto sm:flex-1 sm:px-10 sm:text-base md:flex-initial md:min-w-[10.5rem]"
          >
            Country gallery
          </Link>
          <Link
            href="/assets"
            className="inline-flex min-h-12 shrink-0 snap-start items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-center text-sm font-semibold text-[#2a2a2a] shadow-sm transition-colors hover:border-neutral-400 hover:bg-neutral-50 sm:min-h-14 sm:w-auto sm:flex-1 sm:px-10 sm:text-base md:flex-initial md:min-w-[10.5rem]"
          >
            All assets library
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-12 shrink-0 snap-start items-center justify-center rounded-xl border border-neutral-200 px-5 py-3 text-center text-sm font-semibold text-neutral-800 shadow-sm ring-1 ring-neutral-100 transition-colors hover:border-neutral-400 hover:bg-white sm:min-h-14 sm:w-auto sm:flex-1 sm:px-10 sm:text-base md:flex-initial md:min-w-[11rem]"
            title="Paddle checkout"
          >
            Licenses &amp; pricing
          </Link>
        </div>

        <ul className="grid gap-4 xs:gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {approvedCats.map((c) => {
            const vis = visualsForCategoryKind(c.kind);
            const Icon = vis.Icon;
            const href = `/categories/${encodeURIComponent(c.slug)}`;
            return (
              <li key={c.id} className="min-h-0 list-none">
                <Link
                  href={href}
                  className="group flex min-h-[7rem] w-full touch-manipulation flex-col rounded-2xl border border-neutral-200/95 bg-white/90 p-4 shadow-[0_10px_32px_-28px_rgba(30,41,59,0.55)] outline-none ring-1 ring-transparent transition-[border-color,box-shadow,ring,background-color] hover:border-neutral-300 hover:shadow-[0_18px_44px_-32px_rgba(30,41,59,0.65)] hover:ring-neutral-900/[0.04] active:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 sm:p-5 sm:min-h-[7.25rem] sm:shadow-[0_14px_40px_-34px_rgba(30,41,59,0.65)]"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${vis.accent}`}
                      aria-hidden
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-lg font-semibold tracking-tight text-neutral-900">{c.name}</span>
                      </div>
                      <span className="mt-1 inline-flex max-w-full truncate rounded-full bg-neutral-100 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-neutral-600">
                        {vis.chip}
                      </span>
                    </div>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-blue)]">
                    Open hub
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
