'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
    return <p className="mt-4 text-sm font-medium text-emerald-700">✓ You&apos;re on the list!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]/30"
      />
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? '…' : 'Notify Me'}
      </button>
    </form>
  );
}

export function PricingPlansClient() {
  const price = formatPricingMoney(ONE_TIME_STOCK.displayCents);

  return (
    <main className="marketplace-shell min-h-screen bg-slate-50 py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Simple pricing</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{PRICING_MARKETING.pricingPageDescription}</p>

        <div className="mt-8 space-y-4">
          {/* Free */}
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Free</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Official flat country flags</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>✓ 250+ countries &amp; territories</li>
              <li>✓ SVG, PNG, EPS formats</li>
              <li>✓ No attribution required</li>
              <li>✓ Commercial use allowed</li>
            </ul>
            <Link
              href="/gallery"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse gallery
            </Link>
          </div>

          {/* Single $1 */}
          <div className="rounded-2xl border border-[#2563eb]/30 bg-white p-5 shadow-sm ring-1 ring-[#2563eb]/10 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2563eb]">Premium Design</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{price} <span className="text-sm font-normal text-slate-500">per design</span></p>
              </div>
              <span className="rounded-full bg-[#2563eb]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2563eb]">One-time</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>✓ All formats included (AI, EPS, JPG, PNG, SVG)</li>
              <li>✓ Sphere, wave, mockup, circle variants</li>
              <li>✓ Commercial use — client work &amp; products</li>
              <li>✓ Lifetime access, download anytime</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">{PRICING_CHECKOUT_DISCLAIMER}</p>
          </div>

          {/* Annual — Coming Soon */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Annual Plan</p>
                <p className="mt-2 text-2xl font-bold text-slate-400">$99 <span className="text-sm font-normal">/year</span></p>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Coming Soon</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-400">
              <li>✓ Unlimited downloads</li>
              <li>✓ All current &amp; future flags</li>
              <li>✓ Priority new flag requests</li>
            </ul>
            <AnnualNotifyForm />
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Questions? See{' '}
          <Link href="/licenses" className="font-medium text-[#2563eb] hover:underline">
            license terms
          </Link>{' '}
          or your{' '}
          <Link href="/dashboard" className="font-medium text-[#2563eb] hover:underline">
            dashboard
          </Link>{' '}
          for past purchases.
        </p>
      </div>
    </main>
  );
}
