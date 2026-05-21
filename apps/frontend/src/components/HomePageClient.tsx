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
import HomeGalleryPreview from '@/components/HomeGalleryPreview';
import { LandingCategoryStrip } from '@/components/landing/LandingCategoryStrip';
import { LandingProductRails } from '@/components/landing/LandingProductRails';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { useHasMounted, useRevealInView } from '@/hooks/useRevealInView';
import { SITE_NAME } from '@/lib/seo/site-config';

const TRENDING = ['USA', 'France', 'Japan', 'Germany', 'UK', 'Brazil', 'Canada'] as const;

export type HeroCategoryTab =
  | 'all'
  | 'countries'
  | 'circular'
  | 'historical'
  | 'organizations'
  | 'sports';

const HERO_TABS: { id: HeroCategoryTab; label: string }[] = [
  { id: 'all', label: 'All Flags' },
  { id: 'countries', label: 'Countries' },
  { id: 'circular', label: 'Circular Flags' },
  { id: 'historical', label: 'Historical' },
  { id: 'organizations', label: 'Organizations' },
  { id: 'sports', label: 'Sports' },
];

function buildHeroDestination(tab: HeroCategoryTab, qRaw: string): string {
  const q = qRaw.trim();
  switch (tab) {
    case 'all':
      return q ? `/browse?q=${encodeURIComponent(q)}` : '/browse';
    case 'countries':
      return q ? `/browse?q=${encodeURIComponent(q)}` : '/gallery';
    case 'circular':
      return q ? `/browse?q=${encodeURIComponent(`circular ${q}`)}` : '/browse?q=circular';
    case 'historical':
      return q ? `/browse?q=${encodeURIComponent(q)}` : '/gallery?kind=historical';
    case 'organizations':
      return q ? `/browse?q=${encodeURIComponent(q)}` : '/gallery?kind=organizations';
    case 'sports':
      return q ? `/browse?q=${encodeURIComponent(q)}` : '/browse?q=sports';
    default:
      return '/browse';
  }
}

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
  gradient: string;
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
      animate={isRevealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ delay: planIdx * 0.2 + fIdx * 0.1 }}
      className="flex items-start gap-3 text-black/80"
    >
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#009ab6]">
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          initial={false}
          animate={isRevealed ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ delay: planIdx * 0.2 + fIdx * 0.1 + 0.2 }}
        >
          <path d="M20 6L9 17l-5-5" />
        </motion.svg>
      </div>
      <span className="text-base font-medium">{feature}</span>
    </motion.li>
  );
}

function PricingPlanCard({ plan, idx }: { plan: PricingPlan; idx: number }) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={
        isRevealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }
      }
      transition={{ duration: 0.6, delay: idx * 0.2, type: 'spring' }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-6 sm:p-8 md:p-10 ${plan.gradient} ${
        plan.popular
          ? 'border-[#009ab6] shadow-2xl shadow-[#009ab6]/20 sm:scale-105'
          : 'border-gray-200 shadow-lg transition-all duration-500 hover:border-[#009ab6]/50'
      }`}
    >
      {plan.popular ? (
        <>
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#009ab6]/10 blur-3xl" />
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#009ab6]/5" />
        </>
      ) : null}

      <div className="relative z-10">
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-3xl font-black text-black md:text-4xl">{plan.name}</h3>
          <div className="text-right">
            <div className="text-5xl font-black leading-none text-[#009ab6] md:text-6xl">{plan.price}</div>
            <div className="mt-1 text-base font-medium text-black/65">{plan.period}</div>
          </div>
        </div>

        <ul className="mb-8 space-y-4">
          {plan.features.map((feature, fIdx) => (
            <PlanFeatureRow key={fIdx} feature={feature} planIdx={idx} fIdx={fIdx} />
          ))}
        </ul>

        <Link
          href="/pricing"
          className={`block w-full min-h-[3.75rem] rounded-xl px-8 py-4 text-center text-lg font-bold transition-all duration-300 ${
            plan.popular
              ? 'bg-gradient-to-r from-[#009ab6] to-[#006d7a] text-white shadow-lg hover:from-[#007a8a] hover:to-[#005a66] hover:shadow-xl'
              : 'border-2 border-[#009ab6] bg-white text-[#009ab6] hover:bg-[#009ab6] hover:text-white'
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
  color: string;
};

function HowItWorksStepCard({ step, idx }: { step: StepItem; idx: number }) {
  const { ref, isRevealed } = useRevealInView<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: idx * 0.2 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative text-center"
    >
      <div className="absolute -top-4 left-1/2 z-10 flex h-12 w-12 -translate-x-1/2 transform items-center justify-center rounded-full border-4 border-[#009ab6] bg-white">
        <span className="text-lg font-black text-[#009ab6]">{step.step}</span>
      </div>

      <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 pt-12 shadow-lg transition-all duration-500 hover:border-[#009ab6] hover:shadow-2xl">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}
        >
          <step.icon size={40} className="text-white" />
        </motion.div>
        <h3 className="mb-4 text-3xl font-bold text-black">{step.title}</h3>
        <p className="text-base leading-relaxed text-black/65 md:text-lg">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function HomePageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [heroCategoryTab, setHeroCategoryTab] = useState<HeroCategoryTab>('all');
  const motionBgMounted = useHasMounted();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = buildHeroDestination(heroCategoryTab, searchQuery);
  };

  return (
    <main className="min-h-screen bg-white">

      {/* Hero — stock marketplace spotlight */}
      <section
        className="relative flex min-h-[520px] w-full shrink-0 flex-col justify-center overflow-hidden border-b border-black/15 bg-[#052028] py-14 sm:min-h-[580px] sm:py-16 md:min-h-[620px] md:py-[4.5rem] lg:min-h-[640px] lg:py-[4.75rem] xl:min-h-[700px]"
        aria-labelledby="hero-heading"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#021014] via-[#063948] to-[#009ab6]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(-38deg, rgba(255,255,255,0.12) 0 12px, transparent 12px 36px),
              repeating-linear-gradient(38deg, rgba(0,201,229,0.14) 0 18px, transparent 18px 44px),
              radial-gradient(circle at 15% 20%, rgba(255,96,124,0.16) 0%, transparent 45%),
              radial-gradient(circle at 92% 12%, rgba(255,214,124,0.12) 0%, transparent 40%)
            `,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15"
          aria-hidden
        />

        <div className="relative z-10 marketplace-shell flex w-full flex-col items-center pb-4 pt-2 text-center lg:pb-10 lg:pt-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full max-w-[min(1152px,calc(100%-0rem))] flex-col items-center text-center xl:max-w-[min(1200px,calc(100%-0rem))]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#76e4ef]/95 sm:text-sm">
              Premium flag stock marketplace · {SITE_NAME}
            </p>
            <h1
              id="hero-heading"
              className="mt-6 max-w-5xl text-balance font-black leading-[1.05] tracking-tight text-white md:mt-7"
            >
              <span className="block text-[clamp(2.15rem,2.2vw+1.85rem,3.95rem)] sm:text-[clamp(2.25rem,1.65vw+2.2rem,4.85rem)]">
                Download High-Quality Flag Assets
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-pretty text-lg font-medium leading-relaxed text-white/88 sm:text-xl md:mt-6 md:text-2xl">
              Vectors, icons, country flags, historical flags, organizations, and more.
            </p>

            <nav
              className="mt-9 flex max-w-[calc(100vw-1.75rem)] snap-x gap-3 overflow-x-auto px-2 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:max-w-none sm:flex-wrap sm:justify-center [&::-webkit-scrollbar]:hidden md:mt-11"
              aria-label="Explore categories"
            >
              {HERO_TABS.map(({ id, label }) => {
                const active = heroCategoryTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setHeroCategoryTab(id)}
                    aria-current={active ? 'true' : undefined}
                    className={`min-h-[3rem] shrink-0 snap-start rounded-xl border px-5 py-2.5 text-base font-semibold transition sm:min-h-[3.125rem] sm:px-6 sm:text-[1.05rem] md:text-lg ${
                      active
                        ? 'border-transparent bg-white text-gray-950 shadow-xl shadow-black/25'
                        : 'border-white/25 bg-white/5 text-white/88 hover:bg-white/12 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            <form
              onSubmit={handleSearch}
              className="mt-10 w-full max-w-6xl sm:mt-12"
              role="search"
              aria-label="Search flag assets"
            >
              <div className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-white/18 bg-black/35 shadow-[0_26px_64px_-12px_rgba(0,0,0,0.72)] backdrop-blur-md transition-[box-shadow,border-color] focus-within:border-white/42 focus-within:shadow-[0_32px_72px_-8px_rgba(0,0,0,0.78)] focus-within:ring-2 focus-within:ring-white/25 md:flex-row md:rounded-2xl">
                <div className="flex min-h-[3.625rem] w-full flex-1 items-center rounded-t-2xl bg-white px-4 sm:min-h-16 md:rounded-none md:rounded-l-2xl md:px-6 lg:h-16 lg:min-h-[4rem]">
                  <Search className="h-7 w-7 shrink-0 text-gray-400 sm:h-[1.75rem] sm:w-[1.75rem]" aria-hidden />
                  <label htmlFor="hero-search" className="sr-only">
                    Search query
                  </label>
                  <input
                    id="hero-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search millions of royalty-ready flag visuals…"
                    className="min-w-0 flex-1 border-0 bg-transparent py-4 pl-3 pr-2 text-[1.0625rem] leading-snug text-gray-950 placeholder:text-gray-500 focus:outline-none focus:ring-0 sm:pl-4 sm:text-lg md:text-xl"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[3.625rem] w-full shrink-0 items-center justify-center rounded-b-2xl bg-[#009ab6] px-10 py-4 text-lg font-bold tracking-wide text-white transition hover:bg-[#00788c] hover:shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white md:w-auto md:rounded-none md:rounded-r-2xl lg:min-h-[4rem] lg:px-14 lg:text-xl"
                >
                  Search
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3">
                <span className="w-full shrink-0 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/58 sm:w-auto md:text-base">
                  Trending
                </span>
                {TRENDING.map((term) => (
                  <Link
                    key={term}
                    href={`/browse?q=${encodeURIComponent(term.toLowerCase())}`}
                    className="inline-flex min-h-[2.75rem] items-center rounded-full border border-white/35 bg-black/35 px-5 py-2 text-base font-medium text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/15 hover:text-white"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      <HomeGalleryPreview />

      <LandingProductRails />

      {/* Browse by region */}
      <section className="shrink-0 border-t border-gray-100 bg-gradient-to-b from-gray-50/95 to-white py-14 sm:py-16 md:py-20">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 10 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex flex-col items-center text-center sm:mb-10"
          >
            <h2 className="max-w-3xl text-center text-3xl font-black tracking-tight text-gray-950 sm:text-4xl md:text-[2.25rem]">
              Browse by region
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-base text-gray-600 sm:text-lg">
              Navigate our gallery hubs by geography — curated inside the centered catalog rail.
            </p>
          </SectionReveal>

          <div className="rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-[0_20px_50px_-18px_rgba(6,109,122,0.2)] backdrop-blur-sm sm:p-6 md:rounded-[1.75rem]">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:gap-6">
            {[
              { 
                name: 'Europe', 
                icon: Globe2,
                gradient: 'from-blue-500/10 via-purple-500/10 to-blue-600/10',
                iconColor: 'text-blue-600',
              },
              { 
                name: 'Asia', 
                icon: Globe2,
                gradient: 'from-red-500/10 via-orange-500/10 to-yellow-500/10',
                iconColor: 'text-red-600',
              },
              { 
                name: 'Africa', 
                icon: Globe2,
                gradient: 'from-green-500/10 via-emerald-500/10 to-teal-500/10',
                iconColor: 'text-green-600',
              },
              { 
                name: 'Americas', 
                icon: Globe2,
                gradient: 'from-indigo-500/10 via-blue-500/10 to-cyan-500/10',
                iconColor: 'text-indigo-600',
              },
              { 
                name: 'Oceania', 
                icon: Globe2,
                gradient: 'from-cyan-500/10 via-teal-500/10 to-blue-500/10',
                iconColor: 'text-cyan-600',
              },
              { 
                name: 'Organizations', 
                icon: Flag,
                gradient: 'from-[#009ab6]/10 via-[#006d7a]/10 to-[#009ab6]/10',
                iconColor: 'text-[#009ab6]',
              },
              { 
                name: 'Autonomy', 
                icon: Globe2,
                gradient: 'from-violet-500/10 via-purple-500/10 to-fuchsia-500/10',
                iconColor: 'text-violet-600',
              },
              { 
                name: 'Historical Flag', 
                icon: Flag,
                gradient: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10',
                iconColor: 'text-amber-600',
              },
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
                    className={`group flex min-h-[4rem] w-full items-center gap-4 rounded-xl border border-gray-200/90 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#009ab6] hover:bg-[#009ab6]/[0.04] hover:shadow-xl hover:shadow-[#009ab6]/15 sm:min-h-[4.25rem] sm:gap-5 sm:rounded-2xl sm:px-5 sm:py-4 md:min-h-[5rem]`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} ring-1 ring-black/[0.06] sm:h-12 sm:w-12 md:h-14 md:w-14 md:rounded-2xl`}
                    >
                      <CatIcon
                        size={22}
                        className={`${cat.iconColor} sm:h-6 sm:w-6 md:h-7 md:w-7`}
                      />
                    </div>
                    <span className="min-w-0 flex-1 text-left text-base font-bold leading-snug text-gray-950 group-hover:text-[#009ab6] sm:text-lg lg:text-xl">
                      <span className="line-clamp-2 sm:line-clamp-none sm:truncate">{cat.name}</span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-[#009ab6] sm:h-5 sm:w-5"
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

      <LandingCategoryStrip />

      {/* Stats Section */}
      <section className="bg-gradient-to-b from-white to-[#006d7a]/5 py-24 md:py-28 lg:py-32">
        <div className="marketplace-shell">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-14 lg:gap-16">
            {[
              { number: '200+', label: 'Countries', icon: Globe2 },
              { number: '10K+', label: 'Flag Assets', icon: Flag },
              { number: '50K+', label: 'Downloads', icon: Download },
              { number: '5K+', label: 'Users', icon: Star },
            ].map((stat, idx) => (
              <SectionReveal
                key={idx}
                hidden={{ opacity: 0, y: 20 }}
                visible={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#009ab6]/10 to-[#006d7a]/10 mb-4">
                  <stat.icon size={28} className="text-[#009ab6]" />
                </div>
                <div className="mb-4 text-5xl font-black text-black md:text-6xl xl:text-7xl">{stat.number}</div>
                <div className="text-base font-semibold leading-snug text-black/65 md:text-lg">{stat.label}</div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Plans */}
      <section className="relative overflow-hidden bg-white py-28 lg:py-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23009ab6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="marketplace-shell relative z-10">
          <SectionReveal
            hidden={{ opacity: 0, y: 30 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-20 text-center"
          >
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-[#009ab6]/14 px-5 py-2.5">
              <Crown size={22} className="text-[#009ab6]" />
              <span className="text-lg font-semibold tracking-tight text-[#009ab6]">Premium Plans</span>
            </div>
            <h2 className="mb-8 text-center text-3xl font-black text-gray-950 sm:mb-10 sm:text-4xl xl:text-[2.75rem]">Go Premium</h2>
            <p className="mx-auto max-w-3xl text-pretty text-xl font-medium leading-relaxed text-black/62 md:text-2xl">
              Unlock unlimited flag downloads, commercial use, and exclusive flag assets. Paid plans
              checkout through Paddle (Merchant of Record).
            </p>
          </SectionReveal>

          <div className="grid gap-10 md:grid-cols-2 lg:gap-14 xl:gap-16">
            {[
              {
                name: 'Weekly',
                price: '$5',
                period: 'per week',
                features: ['Unlimited flag downloads', 'Commercial license', 'Priority support', 'High-res formats', 'No watermarks'],
                popular: false,
                gradient: 'from-gray-50 to-white',
              },
              {
                name: 'Monthly',
                price: '$15',
                period: 'per month',
                features: ['Everything in Weekly', 'Early access to new flags', 'Premium-only flags', 'API access', 'Bulk download', 'Custom requests'],
                popular: true,
                gradient: 'from-[#009ab6]/5 via-[#009ab6]/10 to-[#006d7a]/5',
              },
            ].map((plan, idx) => (
              <PricingPlanCard key={idx} plan={plan} idx={idx} />
            ))}
          </div>

          <p className="mx-auto mt-14 max-w-2xl text-center text-pretty text-base text-black/55">
            Homepage amounts are illustrative — live prices and Paddle checkout are on the{' '}
            <Link href="/pricing" className="font-semibold text-[#009ab6] hover:underline">
              pricing page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-b from-[#006d7a]/5 to-white py-28 lg:py-32">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 20 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-20 text-center"
          >
            <h2 className="mb-6 text-center text-3xl font-black text-black sm:text-4xl md:mb-8 md:text-5xl xl:text-[2.75rem]">How It Works</h2>
            <p className="mx-auto max-w-3xl text-pretty text-lg text-black/60 md:text-xl">
              Get started in three simple steps
            </p>
          </SectionReveal>

          <div className="relative grid gap-10 md:grid-cols-3 lg:gap-14 xl:gap-16">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-[#009ab6]/20 via-[#009ab6]/40 to-[#009ab6]/20" />

            {[
              { 
                icon: Search, 
                title: 'Search', 
                desc: 'Find the flag you need by country, region, or organization.',
                step: '01',
                color: 'from-blue-500 to-cyan-500',
              },
              { 
                icon: Download, 
                title: 'Download', 
                desc: 'Get instant access to high-res flag files in multiple formats.',
                step: '02',
                color: 'from-cyan-500 to-teal-500',
              },
              { 
                icon: ShieldCheck, 
                title: 'Use', 
                desc: 'Use flags in your projects with full commercial rights.',
                step: '03',
                color: 'from-teal-500 to-[#009ab6]',
              },
            ].map((step, idx) => (
              <HowItWorksStepCard key={idx} step={step} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#009ab6] via-[#006d7a] to-[#004d5a] py-28 lg:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          {motionBgMounted ? (
            <>
              <motion.div
                initial={false}
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute left-20 top-20 h-96 w-96 rounded-full bg-white blur-3xl"
              />
              <motion.div
                initial={false}
                animate={{
                  x: [0, -100, 0],
                  y: [0, 50, 0],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-white blur-3xl"
              />
            </>
          ) : (
            <>
              <div className="absolute left-20 top-20 h-96 w-96 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-white blur-3xl" />
            </>
          )}
        </div>

        <div className="marketplace-shell relative z-10">
          <div className="w-full text-center">
          <SectionReveal
            hidden={{ opacity: 0, y: 30 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mb-6 text-4xl font-black leading-tight text-white md:text-5xl xl:text-[3.5rem] 2xl:text-6xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-12 max-w-3xl text-pretty text-lg text-white/90 md:text-2xl md:leading-snug xl:text-[1.68rem]">
              Join thousands of designers and developers using {SITE_NAME} for their projects
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/gallery"
                className="inline-flex min-h-[3.5rem] min-w-[12rem] items-center justify-center rounded-xl bg-white px-10 py-4 text-lg font-bold text-[#009ab6] shadow-xl transition hover:scale-[1.02] hover:bg-gray-50"
              >
                Browse Flags
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-[3.5rem] min-w-[12rem] items-center justify-center rounded-xl border-2 border-white bg-white/5 px-10 py-4 text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
                title="Compare plans — Paddle checkout"
              >
                Paddle pricing &amp; plans
              </Link>
            </div>
          </SectionReveal>
          </div>
        </div>
      </section>

    </main>
  );
}
