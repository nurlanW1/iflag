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
import { GalleryFilterBar } from '@/components/landing/GalleryFilterBar';
import { LandingCategoryStrip } from '@/components/landing/LandingCategoryStrip';
import { LandingFlagGalleryPreview } from '@/components/landing/LandingFlagGalleryPreview';
import { LandingTrustStrip } from '@/components/landing/LandingTrustStrip';
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

      <GalleryFilterBar />

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

      <LandingTrustStrip />

      <LandingCategoryStrip />

      {/* Stats */}
      <section className="relative overflow-hidden border-t border-neutral-200/80 bg-[#fafaf9] py-16 md:py-20 lg:py-24">
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle, #2563eb 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="marketplace-shell relative z-10">
          <SectionReveal
            hidden={{ opacity: 0, y: 12 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10 text-center sm:mb-12"
          >
            <h2 className="text-xl font-semibold tracking-tight text-[#2a2a2a] sm:text-2xl">
              Trusted by designers worldwide
            </h2>
          </SectionReveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
            {[
              { number: '200+', label: 'Countries covered', sublabel: 'Official designs', icon: Globe2 },
              { number: '10K+', label: 'Flag assets', sublabel: 'SVG, PNG, WebP', icon: Flag },
              { number: '50K+', label: 'Downloads served', sublabel: 'And counting', icon: Download },
              { number: '5K+', label: 'Members', sublabel: 'Designers & teams', icon: Star },
            ].map((stat, idx) => (
              <SectionReveal
                key={idx}
                hidden={{ opacity: 0, y: 14 }}
                visible={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
              >
                <div className="flex flex-col items-center rounded-2xl border border-neutral-200/80 bg-white p-5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:p-7">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
                    <stat.icon size={22} strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="mb-1 text-3xl font-bold tabular-nums tracking-tight text-[#2a2a2a] sm:text-4xl">{stat.number}</div>
                  <div className="text-sm font-semibold text-neutral-800">{stat.label}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">{stat.sublabel}</div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Simple pricing */}
      <section className="border-t border-neutral-200/80 bg-white py-16 md:py-20 lg:py-24">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 14 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-10 text-center sm:mb-12"
          >
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-amber-200/80 bg-amber-50 px-4 py-2">
              <Crown size={16} className="text-amber-500" strokeWidth={1.75} aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Simple pricing</span>
            </div>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
              Free official flats · {oneTimePrice} for everything else
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600">
              {PRICING_MARKETING.homepageBlurb}
            </p>
          </SectionReveal>

          <div className="grid gap-5 md:grid-cols-2 lg:gap-7">
            <SectionReveal
              hidden={{ opacity: 0, y: 14 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="relative flex h-full flex-col rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 to-emerald-50/20 p-7 md:p-9">
                <div className="mb-1 inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                  Free forever
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#2a2a2a] lg:text-2xl">Official flat country flags</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-neutral-600">
                  Classic official designs stay free with your account — all published formats, no purchase required.
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {['SVG, PNG, WebP formats', 'Commercial use included', 'Instant download'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-neutral-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/gallery"
                  className="mt-7 inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-emerald-700 px-8 text-base font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  Browse free flags
                </Link>
              </div>
            </SectionReveal>

            <SectionReveal
              hidden={{ opacity: 0, y: 14 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
            >
              <div className="flex h-full flex-col rounded-2xl border border-neutral-200/95 bg-white p-7 shadow-sm md:p-9">
                <div className="mb-1 inline-flex w-fit items-center rounded-full bg-[var(--brand-blue-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-blue)]">
                  One-time purchase
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[var(--brand-blue)] lg:text-2xl">{oneTimePrice} per design</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-neutral-600">
                  Sphere, wave, mockup, and other variants — one Paddle checkout, all formats included forever.
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {['All formats in one purchase', 'Perpetual commercial license', 'Instant unlock after checkout'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-neutral-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className="mt-7 inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[var(--brand-blue)] px-8 text-base font-semibold text-[#fafaf9] transition-colors hover:bg-[var(--brand-blue-hover)]"
                >
                  See how pricing works
                </Link>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-neutral-800/30 bg-[var(--brand-blue)] py-16 text-[#fafaf9] md:py-20 lg:py-24">
        {/* Noise/grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgb(255,255,255) 0%, transparent 40%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.5) 0%, transparent 40%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="marketplace-shell relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <SectionReveal hidden={{ opacity: 0, y: 14 }} visible={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
                Start for free
              </div>
              <h2 className="text-balance text-3xl font-semibold leading-snug tracking-tight md:text-[2.125rem] lg:text-[2.375rem]">
                The flag catalog your team deserves
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/80 md:text-[1.0625rem]">
                200+ countries, instant downloads, and commercial licensing that won't keep you guessing. Free official flags — no credit card required.
              </p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/gallery"
                  className="inline-flex min-h-[3.125rem] items-center justify-center rounded-xl bg-white px-10 py-3 text-base font-semibold text-[var(--brand-blue)] shadow-md transition-all hover:bg-neutral-50 hover:shadow-lg"
                >
                  Browse free flags
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex min-h-[3.125rem] items-center justify-center rounded-xl border border-white/30 bg-white/10 px-10 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20"
                >
                  Create free account
                </Link>
              </div>
              <p className="mt-5 text-xs text-white/55">{PRICING_MARKETING.plansLine}</p>
            </SectionReveal>
          </div>
        </div>
      </section>

    </main>
  );
}
