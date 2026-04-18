'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Crown, ArrowRight } from 'lucide-react';
import type { AccountSubscriptionSummary } from '@/types/account';

/**
 * Logged-in subscription account view. Public plan comparison and checkout live on /pricing.
 */
export default function SubscriptionsAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [lsSummary, setLsSummary] = useState<AccountSubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [subscriptionData, lsRes] = await Promise.all([
        api.getMySubscription(),
        fetch('/api/account/subscription-summary', { credentials: 'include' }),
      ]);
      setSubscription(subscriptionData.subscription as Record<string, unknown> | null);
      if (lsRes.ok) {
        setLsSummary((await lsRes.json()) as AccountSubscriptionSummary);
      } else {
        setLsSummary(null);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/subscriptions');
      return;
    }
    loadData();
  }, [user, router, loadData]);

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-gray-600">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-black text-gray-900">Your subscription</h1>
      <p className="mt-1 text-sm text-gray-600">
        Billing runs through Lemon Squeezy. Compare plans, upgrade, or start a subscription from the{' '}
        <Link href="/pricing" className="font-semibold text-[#009ab6] hover:underline">
          pricing page
        </Link>
        .
      </p>

      <div className="mt-8 rounded-2xl border border-[#009ab6]/25 bg-[#009ab6]/5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Crown className="h-5 w-5 text-[#009ab6]" aria-hidden />
          <h2 className="font-bold text-gray-900">Current access</h2>
        </div>
        {lsSummary && lsSummary.status !== 'none' ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Plan</dt>
              <dd className="font-medium text-gray-900">{lsSummary.planName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Status</dt>
              <dd className="font-medium capitalize text-gray-900">{lsSummary.status}</dd>
            </div>
            {lsSummary.renewsAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Renews / ends</dt>
                <dd className="text-gray-900">
                  <time dateTime={lsSummary.renewsAt}>
                    {new Date(lsSummary.renewsAt).toLocaleString()}
                  </time>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-gray-700">
            No active Lemon Squeezy subscription detected for this account.
          </p>
        )}

        {!lsSummary || lsSummary.status === 'none' ? (
          subscription ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Legacy API subscription</p>
              <p className="mt-1">Status: {String(subscription.status)}</p>
              <p className="mt-1 text-xs text-gray-500">
                Prefer the pricing page for new checkouts so billing stays in sync.
              </p>
            </div>
          ) : null
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/pricing"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#009ab6] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#007a8a]"
        >
          View plans &amp; pricing
          <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
        </Link>
        <Link
          href="/dashboard/purchases"
          className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-800 transition hover:border-[#009ab6] hover:text-[#009ab6]"
        >
          Your files &amp; downloads
        </Link>
      </div>

      <p className="mt-8 text-xs text-gray-500">
        To update payment details or cancel, use the customer links in your Lemon Squeezy receipt
        emails—those URLs are signed for your account.
      </p>
    </main>
  );
}
