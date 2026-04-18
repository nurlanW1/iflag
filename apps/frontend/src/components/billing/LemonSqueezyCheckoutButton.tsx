'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CheckoutKind } from '@/lib/billing/lemonsqueezy-mapping';

type Props = {
  kind: CheckoutKind;
  productSlug?: string;
  planSlug?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Starts Lemon Squeezy hosted checkout via `/api/billing/lemonsqueezy/checkout`.
 */
export function LemonSqueezyCheckoutButton({
  kind,
  productSlug,
  planSlug,
  className,
  style,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/billing/lemonsqueezy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          productSlug: kind === 'one_time' ? productSlug : undefined,
          planSlug: kind === 'subscription' ? planSlug : undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
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
      setError('Network error');
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
      {error ? (
        <p className="mt-2 text-xs text-red-600">
          {error}{' '}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>{' '}
          if checkout requires an account.
        </p>
      ) : null}
    </div>
  );
}
