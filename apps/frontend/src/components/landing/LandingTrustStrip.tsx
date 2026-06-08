'use client';

import { CheckCircle2, Download, Shield, Zap } from 'lucide-react';
import { SectionReveal } from '@/components/motion/SectionReveal';

const FEATURES = [
  {
    Icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Official flag designs',
    body: 'Every flag follows official specifications — proportions, colors, and emblems verified against authoritative sources.',
  },
  {
    Icon: Download,
    color: 'text-[var(--brand-blue)]',
    bg: 'bg-[var(--brand-blue-soft)]',
    title: 'All formats included',
    body: 'SVG, PNG (multiple sizes), and WebP — one purchase gives you every format without extra fees or subscriptions.',
  },
  {
    Icon: Shield,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Clear licensing',
    body: 'Free official flats for personal and commercial use. Paid designs include a perpetual commercial license — no surprises.',
  },
  {
    Icon: Zap,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Instant delivery',
    body: 'Downloads are served instantly from CDN. Paid assets unlock immediately after checkout — no waiting, no approval queue.',
  },
] as const;

export function LandingTrustStrip() {
  return (
    <section className="border-t border-neutral-200/80 bg-white py-14 md:py-20 lg:py-24">
      <div className="marketplace-shell">
        <SectionReveal
          hidden={{ opacity: 0, y: 12 }}
          visible={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center sm:mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Why choose us</p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-[#2a2a2a] sm:text-[1.875rem] md:text-[2rem]">
            Built for designers, developers &amp; teams
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-neutral-600">
            The only flag marketplace focused on quality, accuracy, and friction-free licensing.
          </p>
        </SectionReveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {FEATURES.map(({ Icon, color, bg, title, body }, idx) => (
            <SectionReveal
              key={title}
              hidden={{ opacity: 0, y: 16 }}
              visible={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.07 }}
            >
              <div className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-[#fafaf9] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md sm:p-6">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={22} className={color} strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mb-2 text-[0.9375rem] font-semibold text-[#2a2a2a]">{title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-neutral-600">{body}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
