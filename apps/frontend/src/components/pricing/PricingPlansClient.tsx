'use client';

import Link from 'next/link';
import {
  ONE_TIME_STOCK,
  PRICING_CHECKOUT_DISCLAIMER,
  PRICING_MARKETING,
  formatPricingMoney,
} from '@/lib/marketing/pricing-config';

export function PricingPlansClient() {
  const price = formatPricingMoney(ONE_TIME_STOCK.displayCents);

  return (
    <main className="marketplace-shell min-h-screen bg-slate-50 py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Simple pricing</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{PRICING_MARKETING.pricingPageDescription}</p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Free</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Official flat country flags</p>
            <p className="mt-2 text-sm text-slate-600">
              Classic official designs (flat SVG, EPS, JPG where published) stay free with your account — no
              purchase required.
            </p>
            <Link
              href="/gallery"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse gallery
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paid designs</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{price} per design</p>
            <p className="mt-2 text-sm text-slate-600">
              Sphere, wave, mockup, and other premium variants — one checkout unlocks every format for that
              design (AI, EPS, JPG, PNG, and more when listed).
            </p>
            <p className="mt-4 text-sm text-slate-500">{PRICING_CHECKOUT_DISCLAIMER}</p>
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
