'use client';

import clsx from 'clsx';
import { Crown, Sparkles, Tag } from 'lucide-react';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { PricingProSubscribe } from '@/components/pricing/PricingProSubscribe';
import {
  ONE_TIME_STOCK,
  PRO_CHECKOUT,
  SUBSCRIPTION_BREAK_EVEN_DOWNLOADS,
  formatPricingMoney,
  monthlyVsOneTimeSavingsPercent,
  monthlyVsWeeklySavingsPercent,
} from '@/lib/marketing/pricing-config';

type Props = {
  /** Override one-time Paddle product slug (defaults to flat stock price). */
  productSlug?: string;
  /** Short label for the asset, e.g. country name. */
  assetLabel?: string;
  className?: string;
  /** Tighter layout for mobile sticky bars. */
  compact?: boolean;
};

/**
 * Dual offer for visitors without an active subscription:
 * one-time stock purchase vs monthly Pro subscription with savings callout.
 */
export function DownloadPurchaseOffers({
  productSlug = ONE_TIME_STOCK.productSlug,
  assetLabel,
  className,
  compact = false,
}: Props) {
  const oneTimeLabel = formatPricingMoney(ONE_TIME_STOCK.displayCents);
  const monthlyLabel = formatPricingMoney(PRO_CHECKOUT.monthly.displayCents);
  const weeklySavings = monthlyVsWeeklySavingsPercent();
  const catalogSavings = monthlyVsOneTimeSavingsPercent(SUBSCRIPTION_BREAK_EVEN_DOWNLOADS);

  const title = assetLabel
    ? `Unlock ${assetLabel}`
    : 'Get full-resolution downloads';

  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      <div className={clsx('flex items-start gap-2', compact ? 'mb-3' : 'mb-4')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563eb]/10 text-[#2563eb]">
          <Sparkles className="h-4 w-4" aria-hidden strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Choose a single purchase or subscribe for catalog-wide access.
          </p>
        </div>
      </div>

      <div className={clsx('grid gap-3', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        {/* One-time */}
        <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-500" aria-hidden strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Standard
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{oneTimeLabel}</p>
          <p className="mt-1 text-xs text-slate-600">One-time · own this asset</p>
          <CheckoutButton
            kind="one_time"
            productSlug={productSlug}
            className={clsx(
              'mt-4 flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:opacity-50',
            )}
          >
            Buy once — {oneTimeLabel}
          </CheckoutButton>
        </article>

        {/* Monthly subscription */}
        <article className="relative flex flex-col rounded-xl border-2 border-[#2563eb]/35 bg-gradient-to-b from-[#2563eb]/5 to-white p-4 ring-1 ring-[#2563eb]/10">
          {weeklySavings > 0 ? (
            <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Save {weeklySavings}% vs weekly
            </span>
          ) : null}
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" aria-hidden strokeWidth={2.25} />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
              Pro Monthly
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">
            {monthlyLabel}
            <span className="text-sm font-semibold text-slate-500">/mo</span>
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Unlimited catalog downloads
            {catalogSavings > 0 ? (
              <>
                {' '}
                · saves {catalogSavings}% vs {SUBSCRIPTION_BREAK_EVEN_DOWNLOADS}× one-time
              </>
            ) : null}
          </p>
          <PricingProSubscribe
            planSlug={PRO_CHECKOUT.monthly.planSlug}
            className="mt-4 flex min-h-[2.75rem] w-full items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            Subscribe — {monthlyLabel}/mo
          </PricingProSubscribe>
        </article>
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
        Weekly plan also available at {formatPricingMoney(PRO_CHECKOUT.weekly.displayCents)}/wk on{' '}
        <a href="/pricing" className="font-medium text-[#2563eb] hover:underline">
          pricing
        </a>
        .
      </p>
    </div>
  );
}
