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
  Video,
  Image as ImageIcon,
  LayoutGrid,
  Globe2,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import HomeGalleryPreview from '@/components/HomeGalleryPreview';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { useHasMounted, useRevealInView } from '@/hooks/useRevealInView';
import { SITE_NAME } from '@/lib/seo/site-config';

const TRENDING = ['usa', 'france', 'japan', 'germany', 'uk'] as const;

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
      className={`group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-8 md:p-10 ${plan.gradient} ${
        plan.popular
          ? 'scale-105 border-[#009ab6] shadow-2xl shadow-[#009ab6]/20'
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
            <div className="mt-1 text-sm text-black/60">{plan.period}</div>
          </div>
        </div>

        <ul className="mb-8 space-y-4">
          {plan.features.map((feature, fIdx) => (
            <PlanFeatureRow key={fIdx} feature={feature} planIdx={idx} fIdx={fIdx} />
          ))}
        </ul>

        <Link
          href="/pricing"
          className={`block w-full rounded-xl px-6 py-4 text-center font-bold transition-all duration-300 ${
            plan.popular
              ? 'bg-gradient-to-r from-[#009ab6] to-[#006d7a] text-white shadow-lg hover:from-[#007a8a] hover:to-[#005a66] hover:shadow-xl'
              : 'border-2 border-[#009ab6] bg-white text-[#009ab6] hover:bg-[#009ab6] hover:text-white'
          }`}
        >
          Get {plan.name} Plan
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
        <h3 className="mb-4 text-2xl font-bold text-black">{step.title}</h3>
        <p className="leading-relaxed text-black/60">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function HomePageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogScope, setCatalogScope] = useState<'all' | 'vector' | 'raster' | 'video'>('all');
  const motionBgMounted = useHasMounted();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    /** Asset library pages use `asset_type` only; text search is handled on `/browse`. */
    if (catalogScope === 'vector') {
      window.location.href = q
        ? `/browse?${params.toString()}`
        : '/assets?asset_type=vector';
      return;
    }
    if (catalogScope === 'raster') {
      window.location.href = q
        ? `/browse?${params.toString()}`
        : '/assets?asset_type=raster';
      return;
    }
    if (catalogScope === 'video') {
      window.location.href = q
        ? `/browse?${params.toString()}`
        : '/assets?asset_type=video';
      return;
    }
    window.location.href = q ? `/browse?${params.toString()}` : '/browse';
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Above-the-fold: hero + compact category rail (no stretched tiles) */}
      <div className="flex min-h-dvh flex-col">
        {/* Hero — simple gradient background + search rail */}
        <section
          className="relative flex min-h-[min(34dvh,300px)] w-full shrink-0 flex-col justify-center overflow-hidden py-8 sm:min-h-[min(38dvh,340px)] sm:py-10 md:min-h-[min(40dvh,400px)] md:py-12"
          aria-labelledby="hero-heading"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#063a42] via-[#0a5c6a] to-[#009ab6]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5"
            aria-hidden
          />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6">
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 sm:text-[11px]">
                {SITE_NAME}
              </p>
              <h1
                id="hero-heading"
                className="mx-auto mt-1.5 max-w-5xl text-balance font-black uppercase leading-[1.1] tracking-[0.04em] text-white sm:mt-2 sm:tracking-[0.05em]"
              >
                <span className="block text-[clamp(1.15rem,3.5vw+0.3rem,2.1rem)]">
                  Flag assets library
                </span>
                <span className="mt-0.5 block text-[clamp(1rem,2.5vw+0.25rem,1.35rem)] font-bold normal-case tracking-normal text-white/90">
                  Vectors, raster &amp; video — one search
                </span>
              </h1>

              <nav
                className="mt-3 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 sm:mt-4 sm:gap-x-2"
                aria-label="Asset type"
              >
              {(
                [
                  { id: 'all' as const, label: 'All flags', Icon: Flag },
                  { id: 'vector' as const, label: 'Vector', Icon: ImageIcon },
                  { id: 'raster' as const, label: 'Raster', Icon: LayoutGrid },
                  { id: 'video' as const, label: 'Video', Icon: Video },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = catalogScope === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCatalogScope(id)}
                    aria-current={active ? 'true' : undefined}
                    className={`group inline-flex items-center gap-1.5 border-b-2 px-2 py-1.5 text-xs font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm ${
                      active
                        ? 'border-white text-white'
                        : 'border-transparent text-white/65 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100 sm:h-4 sm:w-4" aria-hidden />
                    {label}
                  </button>
                );
              })}
              </nav>

              <form
                onSubmit={handleSearch}
                className="mx-auto mt-3 w-full max-w-full sm:mt-4"
                role="search"
                aria-label="Search flag assets"
              >
                <div className="flex w-full items-stretch overflow-hidden rounded-full border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
                  <div className="flex min-w-0 flex-1 items-center rounded-l-full bg-white pl-3 sm:pl-6 md:pl-8">
                    <Search className="h-4 w-4 shrink-0 text-black/45 sm:h-5 sm:w-5 md:h-6 md:w-6" aria-hidden />
                    <label htmlFor="hero-search" className="sr-only">
                      Search query
                    </label>
                    <input
                      id="hero-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Country, tag, or name…"
                      className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-2.5 pr-2 text-sm text-black placeholder:text-black/45 focus:outline-none focus:ring-0 sm:py-3.5 sm:pl-4 sm:pr-3 sm:text-base md:py-4 md:text-lg"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 bg-[#009ab6] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#007a8a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-10 sm:py-3.5 sm:text-sm sm:tracking-[0.12em] md:px-12 md:text-base"
                  >
                    Search
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:gap-2">
                  <span className="w-full text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:w-auto sm:pr-1">
                    Trending
                  </span>
                  {TRENDING.map((term) => (
                    <Link
                      key={term}
                      href={`/browse?q=${encodeURIComponent(term)}`}
                      className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-white/20 sm:px-3 sm:py-1 sm:text-sm"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Categories — full-width band (matches hero weight), larger tiles */}
        <section className="shrink-0 border-t border-gray-100 bg-gradient-to-b from-gray-50/90 to-white pb-8 pt-5 sm:pb-10 sm:pt-7 md:pb-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <SectionReveal
              hidden={{ opacity: 0, y: 10 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 flex flex-col items-center text-center sm:mb-6"
            >
              <h2 className="text-xl font-black tracking-tight text-black sm:text-2xl md:text-3xl">
                Browse by region
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-black/55 sm:text-base">
                Jump straight into a collection — two rows across the full catalog width
              </p>
            </SectionReveal>

            <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-md backdrop-blur-sm sm:rounded-3xl sm:p-4 md:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:gap-5">
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
              return (
                <SectionReveal
                  key={idx}
                  hidden={{ opacity: 0, y: 6 }}
                  visible={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.02 }}
                  className="min-w-0"
                >
                  <Link
                    href={`/assets?category=${cat.name.toLowerCase()}`}
                    className={`group flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl border border-gray-200/90 bg-white px-3 py-2.5 transition-all duration-200 hover:border-[#009ab6] hover:bg-[#009ab6]/[0.05] hover:shadow-lg hover:shadow-[#009ab6]/12 sm:min-h-[3.75rem] sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3 md:min-h-[4.25rem] md:px-5 md:py-3.5`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} ring-1 ring-black/[0.06] sm:h-12 sm:w-12 md:h-14 md:w-14 md:rounded-2xl`}
                    >
                      <CatIcon
                        size={22}
                        className={`${cat.iconColor} sm:h-6 sm:w-6 md:h-7 md:w-7`}
                      />
                    </div>
                    <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-snug text-gray-900 group-hover:text-[#009ab6] sm:text-base md:text-lg">
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
      </div>

      {/* Gallery Preview Section */}
      <HomeGalleryPreview />

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-[#006d7a]/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
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
                <div className="text-4xl md:text-5xl font-black text-black mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-black/60 font-medium">{stat.label}</div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Plans */}
      <section className="py-24 px-4 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23009ab6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <SectionReveal
            hidden={{ opacity: 0, y: 30 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#009ab6]/10 rounded-full mb-6">
              <Crown size={18} className="text-[#009ab6]" />
              <span className="text-sm font-semibold text-[#009ab6]">Premium Plans</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-black">Go Premium</h2>
            <p className="text-xl md:text-2xl text-black/60 max-w-2xl mx-auto">
              Unlock unlimited flag downloads, commercial use, and exclusive flag assets.
            </p>
          </SectionReveal>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
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
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#006d7a]/5 to-white">
        <div className="max-w-7xl mx-auto">
          <SectionReveal
            hidden={{ opacity: 0, y: 20 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-black">How It Works</h2>
            <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
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
      <section className="py-24 px-4 bg-gradient-to-br from-[#009ab6] via-[#006d7a] to-[#004d5a] relative overflow-hidden">
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

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <SectionReveal
            hidden={{ opacity: 0, y: 30 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mb-6 text-4xl font-black text-white md:text-5xl lg:text-6xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-white/90 md:text-2xl">
              Join thousands of designers and developers using {SITE_NAME} for their projects
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/gallery"
                className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-[#009ab6] shadow-xl transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-2xl"
              >
                Browse Flags
              </Link>
              <Link
                href="/pricing"
                className="rounded-xl border-2 border-white bg-transparent px-8 py-4 text-lg font-bold text-white transition-all duration-300 hover:bg-white/10"
              >
                View Plans
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>

    </main>
  );
}
