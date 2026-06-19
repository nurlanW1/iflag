'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { SignInButton, useAuth, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { postPaddleCheckout } from '@/lib/billing/client-checkout';
import type { CheckoutKind } from './checkout-button-types';

type Props = {
  kind: CheckoutKind;
  productSlug?: string;
  assetGroupKey?: string | null;
  assetId?: string | null;
  fileId?: string | null;
  assetProductSlug?: string | null;
  countrySlug?: string | null;
  planSlug?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /** Hide signed-in footer — use when parent shows a shared checkout footnote. */
  minimal?: boolean;
  /** Called when checkout API reports the user already owns this asset. */
  onAlreadyPurchased?: () => void;
};

/**
 * Paddle checkout for Clerk users — sign-in state from `useUser()`, token from `getToken()`.
 */
export function CheckoutButtonClerk({
  kind,
  productSlug,
  assetGroupKey,
  assetId,
  fileId,
  assetProductSlug,
  countrySlug,
  planSlug,
  className,
  style,
  children,
  minimal = false,
  onAlreadyPurchased,
}: Props) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = pathname?.startsWith('/') ? pathname : '/pricing';

  const onSubscribeClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await postPaddleCheckout(getToken, {
        kind,
        productSlug,
        assetGroupKey,
        assetId,
        fileId,
        assetProductSlug,
        countrySlug,
        planSlug,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.alreadyPurchased) {
        onAlreadyPurchased?.();
        return;
      }
      // Extract _ptxn from checkout URL and open Paddle overlay directly.
      // This avoids the successUrl validation error on Initialize().
      try {
        const ptxn = new URL(result.url).searchParams.get('_ptxn');
        if (ptxn && window.Paddle?.Checkout) {
          window.Paddle.Checkout.open({
            transactionId: ptxn,
            settings: {
              displayMode: 'overlay',
              successUrl: `${window.location.origin}/thank-you`,
            },
          });
          return;
        }
      } catch {
        // fall through to redirect
      }
      window.location.href = result.url;
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <button
        type="button"
        disabled
        style={style}
        className={
          className ||
          'w-full rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white opacity-50'
        }
      >
        Loading…
      </button>
    );
  }

  if (!isSignedIn) {
    if (minimal) {
      return (
        <SignInButton mode="redirect" forceRedirectUrl={returnTo}>
          <button
            type="button"
            style={style}
            className={
              className ||
              'inline-flex min-h-[2.25rem] items-center justify-center rounded-lg px-3.5 text-xs font-semibold'
            }
          >
            {children}
          </button>
        </SignInButton>
      );
    }

    return (
      <div>
        <SignInButton mode="redirect" forceRedirectUrl={returnTo}>
          <button
            type="button"
            style={style}
            className={
              className ||
              'w-full rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]'
            }
          >
            Sign in to continue
          </button>
        </SignInButton>
        <p className="mt-2 text-center text-xs text-neutral-400">
          Sign in with your account — checkout is hosted by Paddle.
        </p>
      </div>
    );
  }

  const email =
    user?.primaryEmailAddress?.emailAddress?.trim() ||
    user?.emailAddresses?.[0]?.emailAddress?.trim();

  return (
    <div>
      <button
        type="button"
        onClick={() => void onSubscribeClick()}
        disabled={loading}
        style={style}
        className={
          className ||
          'w-full rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-50'
        }
      >
        {loading ? 'Redirecting…' : children}
      </button>
      {email && !minimal ? (
        <p className="mt-2 text-center text-xs text-neutral-400">
          Signed in as {email} — secure Paddle checkout.
        </p>
      ) : null}
      {error ? (
        <p className={clsx('text-red-600', minimal ? 'mt-1 text-[10px] leading-snug' : 'mt-2 text-xs')}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
