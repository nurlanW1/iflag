import Link from 'next/link';
import { CreditCard, Crown, ArrowRight, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { fetchAccountSubscriptionSummary } from '@/lib/account/dashboard-data';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-900',
    trialing: 'bg-amber-100 text-amber-900',
    past_due: 'bg-red-100 text-red-800',
    canceled: 'bg-gray-200 text-gray-800',
    none: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold capitalize ${styles[status] ?? styles.none}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default async function DashboardSubscriptionPage() {
  const user = await getSessionUserFromCookies();
  if (!user) return null;

  const sub = await fetchAccountSubscriptionSummary(user.id);
  const hasPlan =
    sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due';

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black text-gray-900">Subscription</h1>
      <p className="mt-1 text-sm text-gray-600">
        Pro access through your plan is verified on every download. One-time purchases stay in{' '}
        <Link href="/dashboard/purchases" className="font-medium text-[#009ab6] hover:underline">
          Your files
        </Link>{' '}
        even without an active subscription.
      </p>

      {sub.lapsed && !hasPlan ? (
        <div
          className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"
          role="status"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="font-semibold">Previous plan: {sub.lapsed.planName}</p>
            <p className="mt-1">
              Access ended{' '}
              <time dateTime={sub.lapsed.endedAt}>
                {new Date(sub.lapsed.endedAt).toLocaleString()}
              </time>{' '}
              ({sub.lapsed.status}). Anything you bought outright remains available under Your files.
            </p>
          </div>
        </div>
      ) : null}

      {!hasPlan ? (
        <div className="mt-8 space-y-6">
          <EmptyState
            icon={CreditCard}
            title="No active subscription"
            description="Subscribe for catalog-wide Pro downloads while your plan is active, or buy individual flags to own permanently."
            action={{ label: 'Compare plans', href: '/pricing' }}
          />
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#009ab6] hover:underline"
          >
            Open pricing page
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-[#009ab6]/30 bg-gradient-to-br from-[#009ab6]/8 to-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Crown className="h-6 w-6 text-[#009ab6]" aria-hidden />
              <h2 className="text-lg font-bold text-gray-900">Current plan</h2>
              <StatusBadge status={sub.status} />
            </div>
            <p className="mt-3 text-xl font-black text-gray-900">{sub.planName ?? 'Pro'}</p>
            {sub.renewsAt ? (
              <p className="mt-2 text-sm text-gray-700">
                <span className="font-medium">Access through </span>
                <time dateTime={sub.renewsAt} className="font-semibold text-gray-900">
                  {new Date(sub.renewsAt).toLocaleString()}
                </time>
              </p>
            ) : null}
            {sub.status === 'past_due' ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                Payment issue — update billing in Lemon Squeezy (use the link from your last receipt)
                to avoid losing Pro downloads.
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-[#009ab6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007a8a]"
              >
                View pricing &amp; plans
              </Link>
              <Link
                href="/subscriptions"
                className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-[#009ab6]"
              >
                Account subscription page
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
