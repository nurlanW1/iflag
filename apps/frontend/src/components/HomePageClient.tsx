'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Search,
  Download,
  Crown,
  Star,
  ShieldCheck,
  Flag,
  Globe2,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { EditorialHero } from '@/components/landing/EditorialHero';
import { LandingCategoryStrip } from '@/components/landing/LandingCategoryStrip';
import { LandingFlagGalleryPreview } from '@/components/landing/LandingFlagGalleryPreview';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { useRevealInView } from '@/hooks/useRevealInView';
import { SITE_NAME } from '@/lib/seo/site-config';
import { buildHeroDestination } from '@/lib/landing/hero-categories';
import { HOMEPAGE_PLAN_CARDS, ONE_TIME_STOCK, PRICING_MARKETING, formatPricingMoney } from '@/lib/marketing/pricing-config';

type PricingPlan = {
  name: string;
  priceCents: number;
  period: string;
  features: readonly string[];
  popular: boolean;
  savingsBadge?: string;
};

function PlanFeatureRow({
  feature,
  planIdx,
  fIdx,
}: {
  feature: string;
  planIdx: number;
  fIdx: number;
}) {
  const { ref, isRevealed } = useRevealInView<HTMLLIElement>();
  return (
    <motion.li
      ref={ref}
      initial={false}
      animate={isRevealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
      transition={{ delay: planIdx * 0.08 + fIdx * 0.05, duration: 0.35 }}
      className="flex items-start gap-3 text-neutral-700"
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)]">
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          initial={false}
          animate={isRevealed ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ delay: planIdx * 0.08 + fIdx * 0.05 + 0.08, duration: 0.35 }}
        >
          <path d="M20 6L9 17l-5-5" />
        </motion.svg>
      </div>
      <span className="text-base leading-relaxed">{feature}</span>
    </motion.li>
  );
}

function PricingPlanCard({ plan, idx }: { plan: PricingPlan; idx: number }) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, delay: idx * 0.08 }}
      className={`rounded-2xl border bg-white p-8 shadow-sm transition-[box-shadow,border-color] duration-300 hover:shadow-md md:p-10 ${
        plan.popular
          ? 'border-[#9a7d45]/35 ring-1 ring-[#9a7d45]/25'
          : 'border-neutral-200/95 hover:border-neutral-300'
      }`}
    >
      <div className="relative">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#2a2a2a] md:text-3xl">{plan.name}</h3>
            {plan.popular ? (
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-[#9a7d45]">Recommended</p>
            ) : null}
          </div>
          <div className="text-left sm:text-right">
            <div className="text-4xl font-semibold tabular-nums leading-none text-[var(--brand-blue)] md:text-5xl">
              {formatPricingMoney(plan.priceCents)}
            </div>
            <div className="mt-2 text-base text-neutral-600">{plan.period}</div>
            {plan.savingsBadge ? (
              <p className="mt-1 text-sm font-medium text-emerald-700">{plan.savingsBadge}</p>
            ) : null}
          </div>
        </div>

        <ul className="mb-10 space-y-3">
          {plan.features.map((feature, fIdx) => (
            <PlanFeatureRow key={fIdx} feature={feature} planIdx={idx} fIdx={fIdx} />
          ))}
        </ul>

        <Link
          href="/pricing"
          title="Paddle checkout"
          className={`block min-h-[3.25rem] w-full rounded-xl px-8 py-3.5 text-center text-base font-semibold transition-colors duration-200 ${
            plan.popular
              ? 'bg-[var(--brand-blue)] text-[#fafaf9] hover:bg-[var(--brand-blue-hover)]'
              : 'border border-neutral-300 bg-white text-[#2a2a2a] hover:border-neutral-400 hover:bg-neutral-50'
          }`}
        >
          Go to Paddle checkout
        </Link>
      </div>
    </motion.div>
  );
}

type StepItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
  step: string;
};

function HowItWorksStepCard({ step, idx }: { step: StepItem; idx: number }) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.45, delay: idx * 0.08 }}
      className="relative pt-8 text-center"
    >
      <div className="absolute left-1/2 top-0 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-[var(--brand-blue)] shadow-sm">
        {step.step}
      </div>

      <div className="rounded-2xl border border-neutral-200/95 bg-white p-8 pt-14 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-10 md:pt-16">
        <div className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-neutral-100 text-[var(--brand-blue)] ring-1 ring-neutral-200/90">
          <step.icon size={36} strokeWidth={1.5} aria-hidden />
        </div>
        <h3 className="mb-3 text-xl font-semibold tracking-tight text-[#2a2a2a] md:text-2xl">{step.title}</h3>
        <p className="text-base leading-relaxed text-neutral-600 md:text-[1.0625rem]">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function HomePageClient() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = buildHeroDestination('all', searchQuery);
  };

  return (
    <main className="min-h-screen bg-[#fafaf9]">

      <EditorialHero
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSubmitSearch={handleSearch}
      />

      {/* Browse by region */}
      <section className="shrink-0 border-t border-neutral-200/80 bg-white py-16 md:py-24 lg:py-28">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 10 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12 flex max-w-3xl flex-col sm:mb-14"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
              Explore the gallery by region
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
              Jump into continents, autonomy sets, diplomacy rails, or historical ribbons—balanced grids that mirror how our gallery is indexed.
              For licensed catalog picks, browse the taxonomy strip below after this rail.
            </p>
          </SectionReveal>

          <div className="rounded-2xl border border-neutral-200/90 bg-[#fafaf9] p-4 sm:p-6 lg:rounded-[1.35rem]">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4 lg:gap-5">
              {[
                { name: 'Europe', icon: Globe2 },
                { name: 'Asia', icon: Globe2 },
                { name: 'Africa', icon: Globe2 },
                { name: 'Americas', icon: Globe2 },
                { name: 'Oceania', icon: Globe2 },
                { name: 'Organizations', icon: Flag },
                { name: 'Autonomy', icon: Globe2 },
                { name: 'Historical Flag', icon: Flag },
              ].map((cat, idx) => {
                const CatIcon = cat.icon;
                const galleryHref =
                  cat.name === 'Organizations'
                    ? '/gallery?kind=organizations'
                    : cat.name === 'Autonomy'
                      ? '/gallery?kind=autonomy'
                      : cat.name === 'Historical Flag'
                        ? '/gallery?kind=historical'
                        : `/gallery?region=${encodeURIComponent(cat.name)}`;
                return (
                  <SectionReveal
                    key={idx}
                    hidden={{ opacity: 0, y: 6 }}
                    visible={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.02 }}
                    className="min-w-0"
                  >
                    <Link
                      href={galleryHref}
                      className="group flex min-h-[3.875rem] w-full items-center gap-3 rounded-xl border border-neutral-200/95 bg-white px-3 py-3 shadow-[0_1px_4px_-1px_rgba(30,41,59,0.08)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-neutral-400 hover:bg-neutral-50 hover:shadow-sm sm:min-h-[4.25rem] sm:gap-4 sm:rounded-xl sm:px-4 sm:py-4 md:min-h-[4.75rem]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[var(--brand-blue)] ring-1 ring-neutral-200/80 sm:h-11 sm:w-11 md:h-12 md:w-12">
                        <CatIcon size={21} strokeWidth={1.75} aria-hidden />
                      </div>
                      <span className="min-w-0 flex-1 text-left text-base font-medium leading-snug text-[#2a2a2a] transition-colors group-hover:text-neutral-800 sm:text-[1.0625rem]">
                        <span className="line-clamp-2 sm:line-clamp-none sm:truncate">{cat.name}</span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-600 sm:h-5 sm:w-5"
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

      {/* Premium Plans */}
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
              <span className="text-sm font-medium uppercase tracking-[0.14em] text-neutral-600">Premium plans</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
              Licenses without friction
            </h2>
            <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
              {PRICING_MARKETING.homepageBlurb} Paid checkout routes through Paddle as Merchant of Record.
            </p>
          </SectionReveal>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12 xl:gap-14">
            {HOMEPAGE_PLAN_CARDS.map((plan, idx) => (
              <PricingPlanCard key={plan.name} plan={plan} idx={idx} />
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-pretty text-base text-neutral-600">
            Single assets from {formatPricingMoney(ONE_TIME_STOCK.displayCents)} — full checkout details on the{' '}
            <Link href="/pricing" className="font-semibold text-[var(--brand-blue)] underline-offset-4 hover:underline">
              pricing page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-neutral-200/80 bg-[#fafaf9] py-16 md:py-24 lg:py-28">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 12 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-14 max-w-3xl md:mb-16"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[2rem] lg:text-[2.125rem]">
              How it works
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-[1.0625rem]">
              Three calm steps from discovery to licensed use — consistent across vectors and raster bundles.
            </p>
          </SectionReveal>

          <div className="relative grid gap-12 md:grid-cols-3 md:gap-10 lg:gap-14">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-[4.25rem] hidden h-px bg-neutral-200 md:block lg:left-[14%] lg:right-[14%]" />

            {[
              {
                icon: Search,
                title: 'Search',
                desc: 'Find the flag you need by country, region, or organization.',
                step: '01',
              },
              {
                icon: Download,
                title: 'Download',
                desc: 'Instant access to high-resolution files in multiple formats.',
                step: '02',
              },
              {
                icon: ShieldCheck,
                title: 'Use',
                desc: 'Deploy with clear licensing aligned to your subscription tier.',
                step: '03',
              },
            ].map((step, idx) => (
              <HowItWorksStepCard key={idx} step={step} idx={idx} />
            ))}
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
                  href="/browse"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#fafaf9] px-10 py-3 text-base font-semibold text-[var(--brand-blue)] shadow-sm transition-colors hover:bg-white"
                >
                  Open browse
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-white/28 bg-transparent px-10 py-3 text-base font-semibold text-[#fafaf9] transition-colors hover:border-white/45 hover:bg-white/[0.06]"
                  title={`Compare plans — ${PRICING_MARKETING.plansLine}`}
                >
                  Plans from {PRICING_MARKETING.monthlyShort}/mo
                </Link>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

    </main>
  );
}
