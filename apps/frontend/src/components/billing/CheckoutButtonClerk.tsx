'use client';

import { usePathname } from 'next/navigation';
import { SignInButton, useAuth, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import type { CheckoutKind } from './checkout-button-types';

type Props = {
  kind: CheckoutKind;
  productSlug?: string;
  planSlug?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

async function fetchClerkSessionToken(
  getToken: ReturnType<typeof useAuth>['getToken'],
): Promise<string | null> {
  const fresh = await getToken({ skipCache: true });
  if (fresh) return fresh;
  return getToken();
}

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
}: Props) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutPayload = JSON.stringify({
    kind,
    productSlug: kind === 'one_time' ? productSlug : undefined,
    planSlug: kind === 'subscription' ? planSlug : undefined,
  });

  const postCheckout = async (token: string) =>
    fetch('/api/billing/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: checkoutPayload,
    });

  const onSubscribeClick = async () => {
    setError(null);

    if (!isLoaded) return;

    if (!isSignedIn) {
      const returnTo = pathname?.startsWith('/') ? pathname : '/pricing';
      window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
      return;
    }

    setLoading(true);
    try {
      const token = await fetchClerkSessionToken(getToken);
      if (!token) {
        setError('Could not read your Clerk session. Refresh the page and try again.');
        return;
      }

      const res = await postCheckout(token);
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        code?: string;
        transaction_id?: string;
      };

      if (res.status === 401) {
        setError(
          data.error ||
            'Checkout authorization failed. Confirm CLERK_SECRET_KEY is set on the billing API.',
        );
        return;
      }
      if (!res.ok) {
        if (res.status === 503 && data.code === 'API_URL_MISSING') {
          setError(data.error || 'API URL is not configured on the server.');
          return;
        }
        if (res.status === 503 && data.code === 'CLERK_AUTH_UNAVAILABLE') {
          setError(
            data.error ||
              'Clerk is not configured on the billing API (set CLERK_SECRET_KEY on the backend).',
          );
          return;
        }
        if (res.status === 503 && data.code === 'PADDLE_NOT_CONFIGURED') {
          setError(
            data.error ||
              'Billing is not configured (set PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET on the API server).',
          );
          return;
        }
        if (res.status === 502 && data.code === 'API_UNREACHABLE') {
          setError(data.error || 'Cannot reach the billing API. Try again shortly.');
          return;
        }
        setError(data.error || 'Checkout failed');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError('No checkout URL returned');
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
    const returnTo = pathname?.startsWith('/') ? pathname : '/pricing';
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
            Sign in to subscribe
          </button>
        </SignInButton>
        <p className="mt-2 text-center text-xs text-gray-500">
          Sign in with your account — checkout is hosted by Paddle.
        </p>
      </div>
    );
  }

  const signedInLabel =
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
      {signedInLabel ? (
        <p className="mt-2 text-center text-xs text-gray-500">
          Signed in as {signedInLabel} — secure Paddle checkout.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
