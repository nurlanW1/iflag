'use client';

import { useState } from 'react';
import Link from 'next/link';

export type CheckoutKind = 'one_time' | 'subscription';

type Props = {
  kind: CheckoutKind;
  productSlug?: string;
  planSlug?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /**
   * Override the active provider (otherwise the backend decides via the
   * BILLING_PROVIDER env). Useful for A/B testing.
   */
  provider?: 'paddle' | 'lemonsqueezy';
};

/**
 * Starts a hosted checkout via `/api/billing/checkout` (provider-agnostic
 * Next.js proxy → backend → Paddle / Lemon Squeezy).
 *
 * On success the user is redirected to the returned `url` (Paddle-hosted page
 * or LS-hosted page). Webhooks flow directly to the backend and update the
 * subscription state.
 */
export function CheckoutButton({
  kind,
  productSlug,
  planSlug,
  className,
  style,
  children,
  provider,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          productSlug: kind === 'one_time' ? productSlug : undefined,
          planSlug: kind === 'subscription' ? planSlug : undefined,
          provider,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        transaction_id?: string;
      };
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
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
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#009ab6] disabled:opacity-50'
        }
      >
        {loading ? 'Redirecting…' : children}
      </button>
      {needsLogin ? (
        <p className="mt-2 text-xs text-red-600">
          Please{' '}
          <Link href="/login" className="font-medium underline">
            sign in
          </Link>{' '}
          to continue with checkout.
        </p>
      ) : null}
      {error && !needsLogin ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
