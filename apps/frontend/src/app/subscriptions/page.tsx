'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';

/** Legacy route — subscriptions removed; points users to purchases and pricing. */
export default function SubscriptionsAccountPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/subscriptions');
    }
  }, [user, router]);

  if (!user) {
    return (
      <main className="marketplace-shell min-h-screen py-16 text-center text-neutral-400 sm:py-20">
        Redirecting…
      </main>
    );
  }

  return (
    <main className="marketplace-shell w-full py-12 sm:py-16 lg:py-24">
      <div className="w-full min-w-0 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-[#2a2a2a] lg:text-4xl">Your purchases</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {PRICING_MARKETING.plansLine}. We no longer sell monthly or weekly plans — each paid design is a{' '}
          {PRICING_MARKETING.oneTimeShort} one-time checkout.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--brand-blue)]/20 bg-[var(--brand-blue-soft)] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[var(--brand-blue)]" aria-hidden />
            <h2 className="font-semibold text-[#2a2a2a]">Download access</h2>
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            Paid files you have bought appear under Purchased files. Official flat flags remain free in the gallery.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/purchases"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
          >
            Purchased files
            <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-center text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
