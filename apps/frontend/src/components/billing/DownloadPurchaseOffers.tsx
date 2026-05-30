'use client';

import clsx from 'clsx';
import { useUser } from '@clerk/nextjs';
import { Crown, Tag } from 'lucide-react';
import Link from 'next/link';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { BillingSidebarAuthGate } from '@/components/billing/BillingSidebarAuthGate';
import { PricingProSubscribe } from '@/components/pricing/PricingProSubscribe';
import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';
import {
  ONE_TIME_STOCK,
  PRO_CHECKOUT,
  formatPricingMoney,
  monthlyVsWeeklySavingsPercent,
} from '@/lib/marketing/pricing-config';

type Props = {
  productSlug?: string;
  assetLabel?: string;
  className?: string;
  /** PDP sidebar: reduce padding and type scale */
  compact?: boolean;
};

const btnCompact =
  'inline-flex min-h-[2.25rem] shrink-0 items-center justify-center rounded-lg px-3.5 text-xs font-semibold transition disabled:opacity-50';

/**
 * Compact dual offer for asset sidebars — one-time vs monthly subscription.
 */
export function DownloadPurchaseOffers({
  productSlug = ONE_TIME_STOCK.productSlug,
  assetLabel,
  className,
  compact = false,
}: Props) {
  const clerkUiEnabled = useClerkUiEnabled();
  const { isLoaded, isSignedIn, user } = useUser();

  const oneTimeLabel = formatPricingMoney(ONE_TIME_STOCK.displayCents);
  const monthlyLabel = formatPricingMoney(PRO_CHECKOUT.monthly.displayCents);
  const weeklyLabel = formatPricingMoney(PRO_CHECKOUT.weekly.displayCents);
  const weeklySavings = monthlyVsWeeklySavingsPercent();

  const title = assetLabel ? `Unlock ${assetLabel}` : 'Get full-resolution files';
  const needsAuth = clerkUiEnabled && isLoaded && !isSignedIn;

  const oneTimeRow = (
    <div
      className={clsx(
        'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5',
        compact ? 'py-1.5' : 'py-2',
      )}
    >
      <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Standard</p>
        <p
          className={clsx(
            'font-bold tabular-nums leading-tight text-slate-900',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          {oneTimeLabel}
        </p>
      </div>
      {!needsAuth ? (
        <CheckoutButton
          kind="one_time"
          productSlug={productSlug}
          minimal
          className={clsx(btnCompact, 'border border-slate-900 bg-white text-slate-900 hover:border-[#2563eb] hover:text-[#2563eb]')}
        >
          Buy
        </CheckoutButton>
      ) : null}
    </div>
  );

  const monthlyRow = (
    <div
      className={clsx(
        'relative flex items-center gap-2 rounded-lg border border-[#2563eb]/30 bg-gradient-to-r from-[#2563eb]/[0.06] to-white px-2.5',
        compact ? 'py-1.5' : 'py-2',
      )}
    >
      {weeklySavings > 0 ? (
        <span className="absolute -top-2 right-2 rounded-full bg-emerald-600 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
          −{weeklySavings}%
        </span>
      ) : null}
      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden strokeWidth={2.25} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2563eb]">Pro monthly</p>
        <p
          className={clsx(
            'font-bold tabular-nums leading-tight text-slate-900',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          {monthlyLabel}
          <span className={clsx('font-semibold text-slate-500', compact ? 'text-[10px]' : 'text-xs')}>
            /mo
          </span>
        </p>
      </div>
      {!needsAuth ? (
        <PricingProSubscribe
          planSlug={PRO_CHECKOUT.monthly.planSlug}
          minimal
          className={clsx(btnCompact, 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]')}
        >
          Subscribe
        </PricingProSubscribe>
      ) : null}
    </div>
  );

  const email =
    clerkUiEnabled && isSignedIn
      ? user?.primaryEmailAddress?.emailAddress?.trim() ||
        user?.emailAddresses?.[0]?.emailAddress?.trim()
      : null;

  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200/90 bg-slate-50/50',
        compact ? 'p-2' : 'p-3',
        className,
      )}
    >
      <p
        className={clsx(
          'font-semibold leading-snug text-slate-900',
          compact ? 'line-clamp-2 text-[11px]' : 'line-clamp-2 text-[13px]',
        )}
      >
        {title}
      </p>
      <p
        className={clsx(
          'text-slate-500',
          compact ? 'mt-0 text-[10px] leading-tight' : 'mt-0.5 text-[11px] leading-snug',
        )}
      >
        Buy this file or subscribe for the full catalog.
      </p>

      <div className={clsx(compact ? 'mt-1.5 space-y-1.5' : 'mt-2.5 space-y-2')}>
        {oneTimeRow}
        {monthlyRow}
        {needsAuth ? (
          <BillingSidebarAuthGate
            compact={compact}
            message="Sign in or create a free account to buy this file or subscribe."
          />
        ) : null}
      </div>

      <p
        className={clsx(
          'text-center font-medium leading-snug text-slate-500',
          compact ? 'mt-1.5 text-[9px]' : 'mt-2 text-[10px]',
        )}
      >
        Weekly {weeklyLabel}/wk ·{' '}
        <Link href="/pricing" className="font-medium text-[#2563eb] hover:underline">
          all plans
        </Link>
      </p>

      {isLoaded && email && !needsAuth ? (
        <p
          className={clsx(
            'truncate text-center text-slate-400',
            compact ? 'mt-1 text-[9px]' : 'mt-1.5 text-[10px]',
          )}
          title={email}
        >
          {email} · Paddle checkout
        </p>
      ) : null}
    </div>
  );
}
