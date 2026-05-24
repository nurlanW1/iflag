'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
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

/**
 * Clerk checkout: same-origin `/api/billing/checkout` with `credentials: "include"`.
 * The Route Handler resolves Clerk session server-side — backend login cookies are optional.
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
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const checkoutPayload = JSON.stringify({
    kind,
    productSlug: kind === 'one_time' ? productSlug : undefined,
    planSlug: kind === 'subscription' ? planSlug : undefined,
  });

  const postCheckout = async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const clerkJwt = await getToken({ skipCache: true });
    if (clerkJwt) {
      headers.Authorization = `Bearer ${clerkJwt}`;
    }
    return fetch('/api/billing/checkout', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: checkoutPayload,
    });
  };

  const onClick = async () => {
    setError(null);
    setNeedsLogin(false);

    if (!isLoaded) return;

    if (!isSignedIn) {
      const returnTo = pathname && pathname.startsWith('/') ? pathname : '/pricing';
      window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await postCheckout();
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        code?: string;
        transaction_id?: string;
      };

      if (res.status === 401) {
        setNeedsLogin(true);
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

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading || !isLoaded}
        style={style}
        className={
          className ||
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-50'
        }
      >
        {!isLoaded ? 'Loading…' : loading ? 'Redirecting…' : children}
      </button>
      {needsLogin ? (
        <p className="mt-2 text-xs text-amber-800">
          Sign in to continue.{' '}
          <Link href="/sign-in" className="font-medium underline">
            Sign in
          </Link>
        </p>
      ) : null}
      {error && !needsLogin ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
