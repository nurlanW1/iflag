/**
 * Reads subscription summary from the backend billing API (Postgres / Paddle),
 * not the in-memory marketplace demo store.
 */

import { getBackendApiBaseUrl } from '@/lib/auth/backend-url';
import type { AccountSubscriptionSummary } from '@/types/account';

export type BillingSummaryFetch =
  | { ok: true; summary: AccountSubscriptionSummary }
  | { ok: false };

type BillingSubscriptionPayload = {
  subscription?: Record<string, unknown> | null;
};

export async function fetchSubscriptionSummaryFromBillingApi(
  accessToken: string
): Promise<BillingSummaryFetch> {
  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/billing/subscription`, {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as BillingSubscriptionPayload;
    return { ok: true, summary: billingPayloadToSummary(data) };
  } catch {
    return { ok: false };
  }
}

export function billingPayloadToSummary(data: BillingSubscriptionPayload): AccountSubscriptionSummary {
  const sub = data.subscription ?? null;
  if (!sub) {
    return { planName: null, status: 'none', renewsAt: null, lapsed: null };
  }

  const rawStatus = String(sub.status ?? '');
  const uiStatus = mapSubscriptionStatus(rawStatus);

  const periodEnd = sub.current_period_end;
  let renewsAt: string | null = null;
  if (typeof periodEnd === 'string') renewsAt = periodEnd;
  else if (periodEnd instanceof Date) renewsAt = periodEnd.toISOString();

  const planName =
    (typeof sub.plan_name === 'string' && sub.plan_name.trim()) ||
    (typeof sub.plan_slug === 'string' && sub.plan_slug.trim()) ||
    null;

  if (uiStatus === 'none' || uiStatus === 'canceled') {
    return { planName, status: uiStatus, renewsAt: null, lapsed: null };
  }

  return {
    planName,
    status: uiStatus,
    renewsAt,
    lapsed: null,
  };
}

function mapSubscriptionStatus(status: string): AccountSubscriptionSummary['status'] {
  if (
    status === 'active' ||
    status === 'trialing' ||
    status === 'past_due' ||
    status === 'canceled'
  ) {
    return status;
  }
  if (status === 'expired' || status === 'paused') return 'canceled';
  if (status === 'unpaid') return 'past_due';
  return 'none';
}
