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
  planSlug?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /** Hide signed-in footer — use when parent shows a shared checkout footnote. */
  minimal?: boolean;
};

/**
 * Paddle checkout for Clerk users — sign-in state from `useUser()`, token from `getToken()`.
 */
export function CheckoutButtonClerk({
  kind,
  productSlug,
  planSlug,
  className,
  style,
  children,
  minimal = false,
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
        planSlug,
      });
      if (!result.ok) {
        setError(result.error);
        return;
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
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white opacity-50'
        }
      >
        Loading…
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <div>
        <SignInButton mode="redirect" forceRedirectUrl={returnTo}>
          <button
            type="button"
            style={style}
            className={
              className ||
              'w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]'
            }
          >
            Sign in to continue
          </button>
        </SignInButton>
        <p className="mt-2 text-center text-xs text-gray-500">
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
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-50'
        }
      >
        {loading ? 'Redirecting…' : children}
      </button>
      {email && !minimal ? (
        <p className="mt-2 text-center text-xs text-gray-500">
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
