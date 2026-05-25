'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Crown, Sparkles } from 'lucide-react';
import { PricingProSubscribe } from '@/components/pricing/PricingProSubscribe';
import {
  ONE_TIME_STOCK,
  PLAN_CARD_COPY,
  PRICING_CHECKOUT_DISCLAIMER,
  PRICING_COMPARISON_ROWS,
  PRO_CHECKOUT,
  formatPricingMoney,
  monthlyVsWeeklySavingsPercent,
  type BillingInterval,
} from '@/lib/marketing/pricing-config';

export function PricingPlansClient() {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  const isMonthly = interval === 'monthly';
  const proSlug = isMonthly ? PRO_CHECKOUT.monthly.planSlug : PRO_CHECKOUT.weekly.planSlug;
  const proDisplayCents = isMonthly
    ? PRO_CHECKOUT.monthly.displayCents
    : PRO_CHECKOUT.weekly.displayCents;
  const proCurrency = isMonthly ? PRO_CHECKOUT.monthly.currency : PRO_CHECKOUT.weekly.currency;
  const weeklySavings = monthlyVsWeeklySavingsPercent();

  return (
    <div className="bg-white">
      <div className="marketplace-shell py-10 sm:py-14 lg:py-20 lg:pb-24">
        <div className="text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#2563eb]">
            <Crown className="h-4 w-4 shrink-0 text-amber-500" aria-hidden strokeWidth={2.25} />
            Pricing
          </p>
          <h1 className="mt-2 text-pretty text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] xl:text-[3.35rem]">
            Simple plans for creators and teams
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-pretty text-base text-gray-600 sm:text-lg">
            Start free with previews. Subscribe for catalog-wide Pro downloads, or buy individual
            flags for {formatPricingMoney(ONE_TIME_STOCK.displayCents)} each — whichever fits your
            workflow. Paid checkout is hosted by Paddle (Merchant of Record).
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setInterval('weekly')}
              className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                interval === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly · {formatPricingMoney(PRO_CHECKOUT.weekly.displayCents)}
            </button>
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                interval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly · {formatPricingMoney(PRO_CHECKOUT.monthly.displayCents)}
              {weeklySavings > 0 ? (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  −{weeklySavings}%
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <ul className="mx-auto mt-10 grid max-w-6xl gap-6 sm:mt-12 sm:gap-8 md:grid-cols-2 md:gap-8 lg:mt-14 lg:grid-cols-3 lg:gap-10 xl:gap-12">
          {PLAN_CARD_COPY.map((plan) => {
            const isPro = plan.id === 'pro';
            const isFree = plan.id === 'free';
            const isBusiness = plan.id === 'business';

            return (
              <li
                key={plan.id}
                className={`flex flex-col rounded-2xl border p-6 shadow-sm sm:p-7 xl:p-8 ${
                  plan.highlighted
                    ? 'border-[#2563eb]/40 bg-gradient-to-b from-[#2563eb]/5 to-white ring-2 ring-[#2563eb]/20'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">{plan.name}</h2>
                    <p className="mt-1 text-sm text-gray-600 sm:text-base">{plan.tagline}</p>
                  </div>
                  {plan.highlighted ? (
                    <span className="shrink-0 rounded-full bg-[#2563eb] px-2.5 py-0.5 text-xs font-bold text-white">
                      Popular
                    </span>
                  ) : null}
                  {plan.comingSoon ? (
                    <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                      Soon
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 min-h-[4.5rem]">
                  {isFree ? (
                    <>
                      <p className="text-3xl font-black text-gray-900">$0</p>
                      <p className="mt-1 text-sm text-gray-600">
                        One-time assets from {formatPricingMoney(ONE_TIME_STOCK.displayCents)}
                      </p>
                    </>
                  ) : null}
                  {isPro ? (
                    <>
                      <p className="text-3xl font-black text-gray-900">
                        {formatPricingMoney(proDisplayCents, proCurrency)}
                        <span className="text-lg font-semibold text-gray-500">
                          /{isMonthly ? 'mo' : 'wk'}
                        </span>
                      </p>
                      {isMonthly && weeklySavings > 0 ? (
                        <p className="mt-1 text-sm font-medium text-emerald-700">
                          Save {weeklySavings}% compared to four weekly renewals
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-gray-500">{PRICING_CHECKOUT_DISCLAIMER}</p>
                    </>
                  ) : null}
                  {isBusiness ? (
                    <p className="text-lg font-semibold text-gray-700">Let&apos;s talk</p>
                  ) : null}
                </div>

                <ul className="mt-6 flex-1 space-y-3.5 text-[0.9375rem] leading-relaxed text-gray-700 sm:text-sm sm:leading-normal">
                  {plan.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isFree ? (
                    <Link
                      href="/browse"
                      className="flex min-h-[2.875rem] w-full items-center justify-center rounded-xl border-2 border-gray-900 bg-white py-3.5 text-base font-semibold text-gray-900 transition hover:border-[#2563eb] hover:text-[#2563eb]"
                    >
                      Browse catalog
                    </Link>
                  ) : null}
                  {isPro ? (
                    <PricingProSubscribe
                      planSlug={proSlug}
                      className="flex min-h-[2.875rem] w-full items-center justify-center rounded-xl bg-[#2563eb] py-3.5 text-base font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
                      style={{ width: '100%' } as CSSProperties}
                    >
                      Subscribe with Paddle
                    </PricingProSubscribe>
                  ) : null}
                  {isBusiness ? (
                    <Link
                      href="/contact"
                      className="flex min-h-[2.875rem] w-full items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 py-3.5 text-base font-semibold text-gray-800 transition hover:border-[#2563eb] hover:text-[#2563eb]"
                    >
                      Contact us
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-20 lg:mt-24">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#2563eb]" aria-hidden />
            <h2 className="text-xl font-black text-gray-900">Compare plans</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-900">
                    Feature
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-900">
                    Free
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-[#2563eb]">
                    Pro
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-500">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRICING_COMPARISON_ROWS.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-0">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                      {row.label}
                    </th>
                    <td className="px-4 py-3 text-gray-600">{row.free}</td>
                    <td className="px-4 py-3 text-gray-800">{row.pro}</td>
                    <td className="px-4 py-3 text-gray-500">{row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">{PRICING_CHECKOUT_DISCLAIMER}</p>
      </div>
    </div>
  );
}
