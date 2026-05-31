'use client';

import clsx from 'clsx';
import { useUser } from '@clerk/nextjs';
import { Tag } from 'lucide-react';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { BillingSidebarAuthGate } from '@/components/billing/BillingSidebarAuthGate';
import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';
import { ONE_TIME_STOCK, formatPricingMoney } from '@/lib/marketing/pricing-config';

type Props = {
  productSlug?: string;
  assetGroupKey?: string | null;
  assetLabel?: string;
  className?: string;
  /** PDP sidebar: reduce padding and type scale */
  compact?: boolean;
  onAlreadyPurchased?: () => void;
};

const btnCompact =
  'inline-flex min-h-[2.25rem] shrink-0 items-center justify-center rounded-lg px-3.5 text-xs font-semibold transition disabled:opacity-50';

/** Single $1 one-time purchase CTA for paid flag designs. */
export function DownloadPurchaseOffers({
  productSlug = ONE_TIME_STOCK.productSlug,
  assetGroupKey,
  assetLabel,
  className,
  compact = false,
  onAlreadyPurchased,
}: Props) {
  const clerkUiEnabled = useClerkUiEnabled();
  const { isLoaded, isSignedIn, user } = useUser();

  const priceLabel = formatPricingMoney(ONE_TIME_STOCK.displayCents);
  const title = assetLabel ? `Unlock ${assetLabel}` : 'Download this design';
  const needsAuth = clerkUiEnabled && isLoaded && !isSignedIn;

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
        One-time purchase · all formats included
      </p>

      <div
        className={clsx(
          'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5',
          compact ? 'mt-1.5 py-1.5' : 'mt-2.5 py-2',
        )}
      >
        <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Full download</p>
          <p
            className={clsx(
              'font-bold tabular-nums leading-tight text-slate-900',
              compact ? 'text-sm' : 'text-base',
            )}
          >
            {priceLabel}
          </p>
        </div>
        {!needsAuth ? (
          <CheckoutButton
            kind="one_time"
            productSlug={productSlug}
            assetGroupKey={assetGroupKey}
            onAlreadyPurchased={onAlreadyPurchased}
            minimal
            className={clsx(
              btnCompact,
              'border border-slate-900 bg-slate-950 text-white hover:bg-slate-900',
            )}
          >
            Buy
          </CheckoutButton>
        ) : null}
      </div>

      {needsAuth ? (
        <BillingSidebarAuthGate
          compact={compact}
          message="Sign in or create a free account to buy and download this design."
        />
      ) : null}

      {isLoaded && email && !needsAuth ? (
        <p
          className={clsx(
            'truncate text-center text-slate-400',
            compact ? 'mt-1.5 text-[9px]' : 'mt-1.5 text-[10px]',
          )}
          title={email}
        >
          {email} · Paddle checkout
        </p>
      ) : null}
    </div>
  );
}
