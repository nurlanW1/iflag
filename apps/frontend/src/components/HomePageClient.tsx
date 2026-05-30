'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Download,
  Crown,
  Star,
  Flag,
  Globe2,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EditorialHero } from '@/components/landing/EditorialHero';
import { LandingCategoryStrip } from '@/components/landing/LandingCategoryStrip';
import { LandingFlagGalleryPreview } from '@/components/landing/LandingFlagGalleryPreview';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { useRevealInView } from '@/hooks/useRevealInView';
import { SITE_NAME } from '@/lib/seo/site-config';
import { buildHeroDestination } from '@/lib/landing/hero-categories';
import { navigateGalleryCountrySearch } from '@/lib/gallery/gallery-search-navigation';
import { HOME_REGION_HUB_TILES } from '@/lib/gallery/region-hub-tiles';
import { ONE_TIME_STOCK, PRICING_MARKETING, formatPricingMoney } from '@/lib/marketing/pricing-config';

export default function HomePageClient() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void navigateGalleryCountrySearch(searchQuery);
  };

  const oneTimePrice = formatPricingMoney(ONE_TIME_STOCK.displayCents);

  return (
    <main className="min-h-screen bg-[#fafaf9]">

      <EditorialHero
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSubmitSearch={handleSearch}
      />

      {/* Browse by region */}
      <section className="shrink-0 border-t border-neutral-200/80 bg-white py-8 md:py-10 lg:py-12">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 10 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 sm:mb-5"
          >
            <h2 className="text-lg font-semibold tracking-tight text-[#2a2a2a] sm:text-xl">
              Explore the gallery by region
            </h2>
          </SectionReveal>

          <div className="rounded-xl border border-neutral-200/90 bg-[#fafaf9] p-3 sm:p-4">
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:thin] sm:gap-2.5 lg:grid lg:grid-cols-8 lg:overflow-visible lg:pb-0">
              {HOME_REGION_HUB_TILES.map((cat, idx) => {
                const CatIcon = cat.icon;
                return (
                  <SectionReveal
                    key={cat.name}
                    hidden={{ opacity: 0, y: 6 }}
                    visible={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.02 }}
                    className="min-w-[8.75rem] shrink-0 lg:min-w-0"
                  >
                    <Link
                      href={cat.href}
                      className="group flex min-h-[3.25rem] w-full items-center gap-2 rounded-lg border border-neutral-200/90 bg-white px-2.5 py-2 shadow-sm transition-[box-shadow,background-color] duration-200 hover:bg-neutral-50 hover:shadow-md sm:min-h-[3.5rem] sm:gap-2.5 sm:px-3"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9"
                        style={{ backgroundColor: cat.accent }}
                      >
                        <CatIcon size={17} strokeWidth={1.75} className="text-white" aria-hidden />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-neutral-900 sm:text-[0.8125rem]">
                        {cat.name}
                      </span>
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-700"
                        aria-hidden
                      />
                    </Link>
                  </SectionReveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <LandingFlagGalleryPreview />

      <LandingCategoryStrip />

      {/* Stats */}
      <section className="border-t border-neutral-200/80 bg-[#fafaf9] py-16 md:py-24 lg:py-28">
        <div className="marketplace-shell">
          <div className="grid grid-cols-2 gap-6 xs:gap-8 sm:gap-10 md:grid-cols-4 md:gap-16 lg:gap-20">
            {[
              { number: '200+', label: 'Countries', icon: Globe2 },
              { number: '10K+', label: 'Flag assets', icon: Flag },
              { number: '50K+', label: 'Downloads', icon: Download },
              { number: '5K+', label: 'Members', icon: Star },
            ].map((stat, idx) => (
              <SectionReveal
                key={idx}
                hidden={{ opacity: 0, y: 14 }}
                visible={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="text-center"
              >
                <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--brand-blue)] shadow-sm ring-1 ring-neutral-200/90">
                  <stat.icon size={26} strokeWidth={1.75} aria-hidden />
                </div>
                <div className="mb-2 text-4xl font-semibold tabular-nums tracking-tight text-[#2a2a2a] md:text-5xl">{stat.number}</div>
                <div className="text-base font-medium leading-snug text-neutral-600">{stat.label}</div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Simple pricing */}
      <section className="border-t border-neutral-200/80 bg-white py-16 md:py-24 lg:py-28">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 14 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-14 max-w-3xl md:mb-16"
          >
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-neutral-200 bg-[#fafaf9] px-4 py-2">
              <Crown size={19} className="text-amber-500" strokeWidth={1.75} aria-hidden />
              <span className="text-sm font-medium uppercase tracking-[0.14em] text-neutral-600">Simple pricing</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
              Free official flats · {oneTimePrice} for everything else
            </h2>
            <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
              {PRICING_MARKETING.homepageBlurb}
            </p>
          </SectionReveal>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            <SectionReveal
              hidden={{ opacity: 0, y: 14 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-8 md:p-10"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">Free</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#2a2a2a]">Official flat country flags</h3>
              <p className="mt-4 text-base leading-relaxed text-neutral-600">
                Classic official designs stay free with your account — all published formats, no purchase.
              </p>
              <Link
                href="/gallery"
                className="mt-8 inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-emerald-700 px-8 text-base font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                Browse free flags
              </Link>
            </SectionReveal>

            <SectionReveal
              hidden={{ opacity: 0, y: 14 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="rounded-2xl border border-neutral-200/95 bg-white p-8 shadow-sm md:p-10"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">Paid designs</p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--brand-blue)]">{oneTimePrice} per design</h3>
              <p className="mt-4 text-base leading-relaxed text-neutral-600">
                Sphere, wave, mockup, and other variants — one Paddle checkout, all formats included.
              </p>
              <Link
                href="/pricing"
                className="mt-8 inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[var(--brand-blue)] px-8 text-base font-semibold text-[#fafaf9] transition-colors hover:bg-[var(--brand-blue-hover)]"
              >
                How pricing works
              </Link>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-neutral-800/30 bg-[var(--brand-blue)] py-16 text-[#fafaf9] md:py-24 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 22%, rgb(184,92,92) 0%, transparent 42%), radial-gradient(circle at 88% 12%, rgb(92,122,168) 0%, transparent 38%), radial-gradient(circle at 55% 88%, rgb(201,162,39) 0%, transparent 36%)',
          }}
        />

        <div className="marketplace-shell relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <SectionReveal hidden={{ opacity: 0, y: 14 }} visible={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <h2 className="text-3xl font-semibold leading-snug tracking-tight md:text-[2.125rem] lg:text-[2.25rem]">
                Begin with the catalog
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/82 md:text-[1.0625rem]">
                Explore curated hubs or jump straight into vectors — {SITE_NAME} keeps downloads predictable for teams.
              </p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/gallery"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#fafaf9] px-10 py-3 text-base font-semibold text-[var(--brand-blue)] shadow-sm transition-colors hover:bg-white"
                >
                  Open gallery
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-white/28 bg-transparent px-10 py-3 text-base font-semibold text-[#fafaf9] transition-colors hover:border-white/45 hover:bg-white/[0.06]"
                  title={PRICING_MARKETING.plansLine}
                >
                  {PRICING_MARKETING.oneTimePerAsset}
                </Link>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

    </main>
  );
}
