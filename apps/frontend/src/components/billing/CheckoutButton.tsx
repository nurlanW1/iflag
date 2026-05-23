'use client';

import Link from 'next/link';
import { useState } from 'react';

export type CheckoutKind = 'one_time' | 'subscription';

type Props = {
  kind: CheckoutKind;
  productSlug?: string;
  planSlug?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Starts Paddle-hosted checkout via `/api/billing/checkout` (Next.js proxy → backend).
 *
 * On success the user is redirected to the returned `url`. Webhooks go to the backend
 * (`/api/billing/webhook/paddle`) and update subscription / order state.
 */
export function CheckoutButton({
  kind,
  productSlug,
  planSlug,
  className,
  style,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const onClick = async () => {
    setError(null);
    setNeedsLogin(false);
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          productSlug: kind === 'one_time' ? productSlug : undefined,
          planSlug: kind === 'subscription' ? planSlug : undefined,
        }),
      });
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
        if (res.status === 503 && data.code === 'PADDLE_NOT_CONFIGURED') {
          setError(
            data.error ||
              'Billing is not configured (set PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET on the API server).'
          );
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
        disabled={loading}
        style={style}
        className={
          className ||
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-50'
        }
      >
        {loading ? 'Redirecting…' : children}
      </button>
      {needsLogin ? (
        <p className="mt-2 text-xs text-red-600">
          Paddle checkout needs backend login cookies. If you signed up with Clerk, open{' '}
          <Link href="/dashboard" className="font-medium underline">
            Dashboard
          </Link>{' '}
          once (we link your email), then try again. Otherwise{' '}
          <Link href="/login" className="font-medium underline">
            sign in with email/password
          </Link>{' '}
          or{' '}
          <Link href="/sign-in" className="font-medium underline">
            Clerk
          </Link>
          .
        </p>
      ) : null}
      {error && !needsLogin ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
