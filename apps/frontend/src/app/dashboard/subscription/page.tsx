import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';

export default async function DashboardSubscriptionPage() {
  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">Billing</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {PRICING_MARKETING.plansLine}. There are no subscription plans — each paid design is{' '}
        {PRICING_MARKETING.oneTimeShort} via Paddle.
      </p>

      <div className="mt-8 space-y-6">
        <EmptyState
          icon={ShoppingBag}
          title="One-time purchases only"
          description="Your unlocked designs live under Purchased files. Official flat country flags stay free in the gallery."
          action={{ label: 'View purchased files', href: '/dashboard/purchases' }}
        />
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/purchases"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
          >
            Purchased files
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
          >
            Pricing
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
