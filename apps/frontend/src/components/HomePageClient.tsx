'use client';

import Link from 'next/link';
import {
  Download,
  Crown,
  Star,
  Flag,
  PenTool,
  Globe2,
  ChevronRight,
} from 'lucide-react';
import { EditorialHero } from '@/components/landing/EditorialHero';
import { LandingCategoryStrip } from '@/components/landing/LandingCategoryStrip';
import { LandingFlagGalleryPreview } from '@/components/landing/LandingFlagGalleryPreview';
import { SectionReveal } from '@/components/motion/SectionReveal';
import { HOME_REGION_HUB_TILES } from '@/lib/gallery/region-hub-tiles';
import { ONE_TIME_STOCK, PRICING_MARKETING, formatPricingMoney } from '@/lib/marketing/pricing-config';

const HOMEPAGE_TOOL_CARDS = [
  {
    title: 'VS Designer',
    promise: 'Create match graphics in 30 seconds',
    copy: 'Build 1920x1080 football and country matchup graphics. Free watermark preview, $1 clean HD export.',
    href: '/vs-designer',
    badge: 'Premium export',
    icon: Crown,
    accent: '#2563eb',
  },
  {
    title: 'Flag Editor',
    promise: 'Design custom country flags',
    copy: 'Start from a country flag or blank canvas, then add text, shapes, symbols, and colors.',
    href: '/editor/blank',
    badge: 'Creative editor',
    icon: PenTool,
    accent: '#7c3aed',
  },
  {
    title: 'Flag Quiz',
    promise: 'Learn world flags',
    copy: 'Practice country recognition with real Flagswing previews, then browse downloadable assets.',
    href: '/flag-quiz',
    badge: 'Free learning',
    icon: Star,
    accent: '#059669',
  },
];

const HOMEPAGE_QUICK_ACTIONS = [
  {
    title: 'Download a flag file',
    copy: 'Search the country gallery and open published SVG, EPS, PNG, JPG, or WebP formats when available.',
    href: '/gallery',
    cta: 'Browse gallery',
    icon: Globe2,
    accent: '#2563eb',
  },
  {
    title: 'Make a match graphic',
    copy: 'Create a clean 1920x1080 VS image for football posts, thumbnails, and client previews.',
    href: '/vs-designer',
    cta: 'Open VS Designer',
    icon: Crown,
    accent: '#f59e0b',
  },
  {
    title: 'Design a custom flag',
    copy: 'Start from a blank canvas or a country flag, then add shapes, colors, text, and symbols.',
    href: '/editor/blank',
    cta: 'Open Flag Editor',
    icon: PenTool,
    accent: '#7c3aed',
  },
  {
    title: 'Learn before you download',
    copy: 'Practice world flags in the quiz, then jump back into the catalog for matching assets.',
    href: '/flag-quiz',
    cta: 'Play Flag Quiz',
    icon: Star,
    accent: '#059669',
  },
];

const HOMEPAGE_FAQS = [
  {
    question: 'Can I download flags for free?',
    answer: 'Yes. Published official flat country flags stay free where available, while premium variants and VS Designer clean exports use simple paid unlocks.',
  },
  {
    question: 'What formats can I find?',
    answer: 'Asset pages can include SVG, EPS, PNG, JPG, and WebP files. Available formats are shown on each design before download.',
  },
  {
    question: 'What is VS Designer for?',
    answer: 'VS Designer is for fast 1920x1080 match graphics with country flags, team names, events, scores, custom backgrounds, and PNG export.',
  },
];

export default function HomePageClient() {
  const oneTimePrice = formatPricingMoney(ONE_TIME_STOCK.displayCents);

  return (
    <main className="min-h-screen bg-[#fafaf9]">

      <EditorialHero />

      {/* Browse by region */}
      <section className="shrink-0 border-t border-neutral-200/80 bg-white py-5 sm:py-6 lg:py-8">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 10 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-3 sm:mb-4"
          >
            <h2 className="text-base font-semibold tracking-tight text-[#2a2a2a] sm:text-lg lg:text-xl">
              Explore the gallery by region
            </h2>
          </SectionReveal>

          <div className="rounded-xl border border-neutral-200/90 bg-[#fafaf9] p-2.5 sm:p-3 lg:p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5 xl:grid-cols-10">
              {HOME_REGION_HUB_TILES.map((cat, idx) => {
                const CatIcon = cat.icon;
                return (
                  <SectionReveal
                    key={cat.name}
                    hidden={{ opacity: 0, y: 6 }}
                    visible={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.02 }}
                  >
                    <Link
                      href={cat.href}
                      className="group flex min-h-[3rem] w-full items-center gap-2 rounded-lg border border-neutral-200/90 bg-white px-2.5 py-2 shadow-sm transition-[box-shadow,background-color] duration-200 hover:bg-neutral-50 hover:shadow-md sm:min-h-[3.25rem] sm:gap-2 sm:px-2.5 lg:gap-2.5 lg:px-3"
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md sm:h-8 sm:w-8"
                        style={{ backgroundColor: cat.accent }}
                      >
                        <CatIcon size={15} strokeWidth={1.75} className="text-white" aria-hidden />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-neutral-900">
                        {cat.name}
                      </span>
                      <ChevronRight
                        className="h-3 w-3 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-700"
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

      <section className="border-t border-neutral-200/80 bg-white py-8 sm:py-10 lg:py-12" aria-labelledby="quick-start-heading">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 10 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Start faster</p>
              <h2 id="quick-start-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#2a2a2a] sm:text-3xl">
                Choose the shortest path to your flag work
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-neutral-600 sm:text-right">
              Direct routes for downloads, match graphics, custom flag design, and learning tools.
            </p>
          </SectionReveal>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HOMEPAGE_QUICK_ACTIONS.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <SectionReveal
                  key={action.title}
                  hidden={{ opacity: 0, y: 10 }}
                  visible={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                >
                  <Link
                    href={action.href}
                    className="group flex h-full min-h-[12rem] flex-col rounded-2xl border border-neutral-200/90 bg-[#fafaf9] p-5 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-[0_18px_44px_-30px_rgba(15,23,42,0.55)]"
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: action.accent }}
                      aria-hidden
                    >
                      <ActionIcon size={20} strokeWidth={1.9} />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-neutral-950">{action.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-neutral-600">{action.copy}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-blue)]">
                      {action.cta}
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-t border-neutral-200/80 bg-[#fafaf9] py-9 sm:py-11 lg:py-14">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 10 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-7 max-w-2xl text-center sm:mb-8"
          >
            <p className="mx-auto mb-3 inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-blue)] shadow-sm">
              Creator tools
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[#2a2a2a] sm:text-3xl">
              Make more than a download
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
              Build match graphics, customize flags, or practice flag knowledge from the same Flagswing workspace.
            </p>
          </SectionReveal>

          <div className="grid gap-4 md:grid-cols-3 lg:gap-5">
            {HOMEPAGE_TOOL_CARDS.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <SectionReveal
                  key={tool.title}
                  hidden={{ opacity: 0, y: 12 }}
                  visible={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Link
                    href={tool.href}
                    className="group flex h-full min-h-[15rem] flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_18px_44px_-28px_rgba(15,23,42,0.5)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${tool.accent}14`, color: tool.accent }}
                      >
                        <ToolIcon size={20} strokeWidth={1.9} aria-hidden />
                      </div>
                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                        {tool.badge}
                      </span>
                    </div>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">{tool.title}</p>
                    <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-[#2a2a2a]">{tool.promise}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600">{tool.copy}</p>
                    <span className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-neutral-950 px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-[var(--brand-blue)]">
                      Open tool
                      <ChevronRight size={14} aria-hidden />
                    </span>
                  </Link>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>
      {/* Stats */}
      <section className="relative overflow-hidden border-t border-neutral-200/80 bg-[#fafaf9] py-8 sm:py-10 lg:py-14">
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
            className="mb-7 text-center sm:mb-8"
          >
            <h2 className="text-xl font-semibold tracking-tight text-[#2a2a2a] sm:text-2xl">
              Trusted by designers worldwide
            </h2>
          </SectionReveal>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
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
                <div className="flex flex-col items-center rounded-xl border border-neutral-200/80 bg-white p-4 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:rounded-2xl sm:p-5 lg:p-7">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)] sm:mb-4 sm:h-12 sm:w-12">
                    <stat.icon size={19} strokeWidth={1.75} aria-hidden className="sm:hidden" />
                    <stat.icon size={22} strokeWidth={1.75} aria-hidden className="hidden sm:block" />
                  </div>
                  <div className="mb-0.5 text-2xl font-bold tabular-nums tracking-tight text-[#2a2a2a] sm:text-3xl lg:text-4xl">{stat.number}</div>
                  <div className="text-xs font-semibold text-neutral-800 sm:text-sm">{stat.label}</div>
                  <div className="mt-0.5 hidden text-xs text-neutral-500 sm:block">{stat.sublabel}</div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Simple pricing */}
      <section className="border-t border-neutral-200/80 bg-white py-8 sm:py-10 lg:py-14">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 14 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-7 text-center sm:mb-8"
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

      <section className="border-t border-neutral-200/80 bg-white py-9 sm:py-11 lg:py-14" aria-labelledby="homepage-faq-heading">
        <div className="marketplace-shell">
          <SectionReveal
            hidden={{ opacity: 0, y: 10 }}
            visible={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-7 max-w-2xl text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Quick answers</p>
            <h2 id="homepage-faq-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#2a2a2a] sm:text-3xl">
              Common flag download and design questions
            </h2>
          </SectionReveal>

          <div className="grid gap-4 md:grid-cols-3">
            {HOMEPAGE_FAQS.map((item, idx) => (
              <SectionReveal
                key={item.question}
                hidden={{ opacity: 0, y: 10 }}
                visible={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
              >
                <article className="h-full rounded-2xl border border-neutral-200/90 bg-[#fafaf9] p-5">
                  <h3 className="text-base font-semibold text-neutral-950">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">{item.answer}</p>
                </article>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-neutral-800/30 bg-[var(--brand-blue)] py-10 text-[#fafaf9] sm:py-12 lg:py-16">
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
