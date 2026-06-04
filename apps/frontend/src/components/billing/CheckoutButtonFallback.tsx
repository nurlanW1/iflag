'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { CheckoutKind } from './checkout-button-types';
import { ONE_TIME_STOCK } from '@/lib/marketing/pricing-config';

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
  minimal?: boolean;
  onAlreadyPurchased?: () => void;
};

/**
 * When Clerk publishable key is not configured (e.g. CI build, local without Clerk),
 * rely on backend JWT cookies from email/password sessions only.
 */
export function CheckoutButtonFallback({
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
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutPayload = JSON.stringify({
    kind,
    productSlug: kind === 'one_time' ? ONE_TIME_STOCK.productSlug : undefined,
    assetGroupKey: kind === 'one_time' ? assetGroupKey?.trim() || undefined : undefined,
    assetId: kind === 'one_time' ? assetId?.trim() || undefined : undefined,
    fileId: kind === 'one_time' ? fileId?.trim() || undefined : undefined,
    assetProductSlug: kind === 'one_time' ? assetProductSlug?.trim() || undefined : undefined,
    countrySlug: kind === 'one_time' ? countrySlug?.trim() || undefined : undefined,
    planSlug: kind === 'subscription' ? planSlug : undefined,
  });

  const postCheckout = () =>
    fetch('/api/billing/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: checkoutPayload,
    });

  const onClick = async () => {
    setError(null);
    const returnTo = pathname && pathname.startsWith('/') ? pathname : '/pricing';

    if (!loading && !user) {
      window.location.assign(
        `/login?callbackUrl=${encodeURIComponent(returnTo)}`,
      );
      return;
    }

    setBusy(true);
    try {
      let res = await postCheckout();
      let data = (await res.json()) as {
        url?: string;
        error?: string;
        code?: string;
        alreadyPurchased?: boolean;
      };

      if (res.status === 401) {
        setError(
          user
            ? 'Sign in again or allow cookies for this site, then retry checkout.'
            : 'Sign in required for checkout.',
        );
        return;
      }
      if (res.ok && data.alreadyPurchased) {
        onAlreadyPurchased?.();
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
              'Billing is not configured (set PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET on the API server).',
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
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy || loading}
        style={style}
        className={
          className ||
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-50'
        }
      >
        {loading ? 'Loading…' : busy ? 'Redirecting…' : children}
      </button>
      {error ? (
        <p className={`text-red-600 ${minimal ? 'mt-1 text-[10px] leading-snug' : 'mt-2 text-xs'}`}>
          {error}{' '}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </div>
  );
}
