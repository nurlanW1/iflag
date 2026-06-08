'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, Crown, Zap, ArrowRight, Star } from 'lucide-react';
import {
  ONE_TIME_STOCK,
  PRICING_CHECKOUT_DISCLAIMER,
  PRICING_MARKETING,
  formatPricingMoney,
} from '@/lib/marketing/pricing-config';

function AnnualNotifyForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'annual' }),
      });
      setDone(true);
      toast.success("You're on the list!");
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <Check size={16} className="shrink-0" />
        You&apos;re on the list! We&apos;ll notify you at launch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
      />
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {loading ? '…' : 'Notify me'}
      </button>
    </form>
  );
}

const FREE_FEATURES = [
  'Official flat country flags',
  '250+ countries & territories',
  'SVG, PNG, WebP formats',
  'Commercial use included',
  'No attribution required',
  'Instant download',
];

const PAID_FEATURES = [
  'All formats: AI, EPS, SVG, PNG, WebP',
  'Sphere, wave, mockup, circle variants',
  'Commercial use — client work & products',
  'Lifetime access, download anytime',
  'One-time payment, no subscription',
  'Secure checkout via Paddle',
];

const ANNUAL_FEATURES = [
  'Unlimited flag downloads',
  'All current & future designs',
  'Priority new flag requests',
  'Team license (up to 5 seats)',
];

export function PricingPlansClient() {
  const price = formatPricingMoney(ONE_TIME_STOCK.displayCents);

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div className="border-b border-neutral-200/80 bg-white">
        <div className="marketplace-shell py-14 text-center md:py-20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
            <Crown size={13} strokeWidth={1.75} aria-hidden />
            Pricing
          </div>
          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-[#2a2a2a] sm:text-4xl lg:text-[2.5rem]">
            Simple pricing — free flags always free
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-600">
            {PRICING_MARKETING.pricingPageDescription}
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="marketplace-shell py-10 md:py-14 lg:py-16">
        <div className="grid gap-5 lg:grid-cols-3 lg:items-start lg:gap-6">

          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-white p-6 md:p-8">
            <div className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
              Free forever
            </div>
            <div className="mt-5">
              <p className="text-4xl font-bold tabular-nums text-[#2a2a2a]">$0</p>
              <p className="mt-1 text-sm text-neutral-500">No credit card required</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Official flat country flags for personal and commercial projects. Always free with an account.
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/gallery"
              className="mt-8 inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-emerald-700 px-6 text-base font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Browse free flags
            </Link>
          </div>

          {/* Premium / One-time */}
          <div className="relative flex flex-col rounded-2xl border-2 border-[#2563eb]/60 bg-white p-6 shadow-[0_8px_32px_-10px_rgba(37,99,235,0.22)] md:p-8 lg:-mt-2">
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 py-1 text-xs font-bold text-white shadow-sm">
                <Star size={11} fill="currentColor" strokeWidth={0} aria-hidden />
                Most popular
              </span>
            </div>
            <div className="mb-1 mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--brand-blue-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-blue)]">
              <Zap size={11} strokeWidth={2} aria-hidden />
              One-time purchase
            </div>
            <div className="mt-5">
              <p className="text-4xl font-bold tabular-nums text-[#2a2a2a]">
                {price}
                <span className="ml-2 text-base font-normal text-neutral-500">per design</span>
              </p>
              <p className="mt-1 text-sm text-neutral-500">Pay once, use forever</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Premium flag variants — sphere, wave, mockup, circle. All formats included in a single Paddle checkout.
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {PAID_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/gallery"
              className="mt-8 inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 text-base font-semibold text-white transition-colors hover:bg-[var(--brand-blue-hover)]"
            >
              Browse premium designs
              <ArrowRight size={16} aria-hidden />
            </Link>
            <p className="mt-3 text-center text-[11px] text-neutral-400">{PRICING_CHECKOUT_DISCLAIMER}</p>
          </div>

          {/* Annual — Coming soon */}
          <div className="flex flex-col rounded-2xl border border-neutral-200/90 bg-white p-6 opacity-80 md:p-8">
            <div className="mb-1 inline-flex w-fit items-center rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              Coming soon
            </div>
            <div className="mt-5">
              <p className="text-4xl font-bold tabular-nums text-neutral-300">
                $99
                <span className="ml-2 text-base font-normal text-neutral-400">/year</span>
              </p>
              <p className="mt-1 text-sm text-neutral-400">Annual subscription</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              Unlimited downloads for teams and high-volume users. Be first to know at launch.
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {ANNUAL_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-400">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <AnnualNotifyForm />
          </div>

        </div>

        {/* FAQ-like questions */}
        <div className="mt-12 rounded-2xl border border-neutral-200/80 bg-white p-6 md:p-8 lg:mt-14">
          <h2 className="mb-6 text-lg font-semibold text-[#2a2a2a] md:text-xl">Frequently asked questions</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:gap-7">
            {[
              {
                q: 'Do I need an account to download free flags?',
                a: 'Yes — a free account is required to download. Sign up with email or via Clerk auth.',
              },
              {
                q: 'What payment processor handles purchases?',
                a: 'Paddle acts as Merchant of Record. They handle billing, taxes, and receipts.',
              },
              {
                q: 'Can I use flags in client projects?',
                a: 'Free official flags include commercial use. Paid designs include a perpetual commercial license.',
              },
              {
                q: 'What formats are included?',
                a: 'Free flags: SVG, PNG, WebP. Paid designs: all of the above plus AI, EPS, and JPG where available.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl bg-neutral-50 p-4">
                <p className="mb-1.5 text-sm font-semibold text-[#2a2a2a]">{q}</p>
                <p className="text-sm leading-relaxed text-neutral-600">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Questions? See{' '}
          <Link href="/licenses" className="font-medium text-[#2563eb] hover:underline">
            license terms
          </Link>{' '}
          or check your{' '}
          <Link href="/dashboard" className="font-medium text-[#2563eb] hover:underline">
            purchase history
          </Link>.
        </p>
      </div>
    </main>
  );
}
