'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { LemonSqueezyCheckoutButton } from '@/components/billing/LemonSqueezyCheckoutButton';
import {
  PLAN_CARD_COPY,
  PRICING_CHECKOUT_DISCLAIMER,
  PRICING_COMPARISON_ROWS,
  PRO_CHECKOUT,
  type BillingInterval,
} from '@/lib/marketing/pricing-config';

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(0)}`;
  }
}

export function PricingPlansClient() {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  const annualReady = PRO_CHECKOUT.annual.enabled;
  const useAnnualCheckout = interval === 'annual' && annualReady;
  const proSlug = useAnnualCheckout
    ? PRO_CHECKOUT.annual.lemonSqueezyPlanSlug
    : PRO_CHECKOUT.monthly.lemonSqueezyPlanSlug;

  const proDisplayCents = useAnnualCheckout
    ? PRO_CHECKOUT.annual.displayCents
    : PRO_CHECKOUT.monthly.displayCents;

  const proCurrency = useAnnualCheckout
    ? PRO_CHECKOUT.annual.currency
    : PRO_CHECKOUT.monthly.currency;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#009ab6]">Pricing</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
            Simple plans for creators and teams
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600">
            Start free with previews. Subscribe for catalog-wide Pro downloads while your plan is
            active, or buy individual flags to keep forever—whichever fits your workflow.
          </p>
        </div>

        {/* Billing toggle — annual wiring is ready when you enable it in pricing-config + Lemon Squeezy */}
        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                interval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('annual')}
              title="Enable annual checkout in pricing-config when your Lemon Squeezy variant is live"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                interval === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              {!annualReady ? (
                <span className="ml-1.5 text-xs font-normal text-gray-500">(setup)</span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLAN_CARD_COPY.map((plan) => {
            const isPro = plan.id === 'pro';
            const isFree = plan.id === 'free';
            const isBusiness = plan.id === 'business';

            return (
              <li
                key={plan.id}
                className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
                  plan.highlighted
                    ? 'border-[#009ab6]/40 bg-gradient-to-b from-[#009ab6]/5 to-white ring-2 ring-[#009ab6]/20'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{plan.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{plan.tagline}</p>
                  </div>
                  {plan.highlighted ? (
                    <span className="shrink-0 rounded-full bg-[#009ab6] px-2.5 py-0.5 text-xs font-bold text-white">
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
                    <p className="text-3xl font-black text-gray-900">$0</p>
                  ) : null}
                  {isPro ? (
                    <>
                      {interval === 'annual' && !annualReady ? (
                        <>
                          <p className="text-2xl font-black text-gray-900">Annual — coming soon</p>
                          <p className="mt-1 text-sm text-gray-600">
                            Turn on <code className="rounded bg-gray-100 px-1 text-xs">annual.enabled</code> in{' '}
                            <code className="rounded bg-gray-100 px-1 text-xs">pricing-config.ts</code> and map{' '}
                            <code className="rounded bg-gray-100 px-1 text-xs">pro-annual</code> in Lemon Squeezy.
                          </p>
                          <p className="mt-3 text-sm text-gray-500">
                            Monthly today:{' '}
                            <span className="font-semibold text-gray-900">
                              {formatMoney(PRO_CHECKOUT.monthly.displayCents, PRO_CHECKOUT.monthly.currency)}/mo
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-3xl font-black text-gray-900">
                            {formatMoney(proDisplayCents, proCurrency)}
                            <span className="text-lg font-semibold text-gray-500">
                              /{useAnnualCheckout ? 'yr' : 'mo'}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{PRICING_CHECKOUT_DISCLAIMER}</p>
                        </>
                      )}
                    </>
                  ) : null}
                  {isBusiness ? (
                    <p className="text-lg font-semibold text-gray-700">Let&apos;s talk</p>
                  ) : null}
                </div>

                <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-700">
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
                      className="flex w-full items-center justify-center rounded-xl border-2 border-gray-900 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:border-[#009ab6] hover:text-[#009ab6]"
                    >
                      Browse catalog
                    </Link>
                  ) : null}
                  {isPro ? (
                    <>
                      <LemonSqueezyCheckoutButton
                        kind="subscription"
                        planSlug={proSlug}
                        className="w-full rounded-xl bg-[#009ab6] py-3 text-sm font-semibold text-white transition hover:bg-[#007a8a] disabled:opacity-50"
                        style={{ width: '100%' } as CSSProperties}
                      >
                        {interval === 'annual' && !annualReady
                          ? 'Subscribe monthly (via Lemon Squeezy)'
                          : 'Subscribe with Lemon Squeezy'}
                      </LemonSqueezyCheckoutButton>
                      <p className="mt-2 text-center text-xs text-gray-500">
                        Sign in required. Map <code className="rounded bg-gray-100 px-1">{proSlug}</code>{' '}
                        in <code className="rounded bg-gray-100 px-1">LEMONSQUEEZY_VARIANT_MAP_JSON</code>.
                      </p>
                    </>
                  ) : null}
                  {isBusiness ? (
                    <Link
                      href="/contact"
                      className="flex w-full items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-800 transition hover:border-[#009ab6] hover:text-[#009ab6]"
                    >
                      Contact us
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Comparison table */}
        <div className="mt-16">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#009ab6]" aria-hidden />
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
                  <th scope="col" className="px-4 py-3 font-semibold text-[#009ab6]">
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
