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
      <main className="marketplace-shell min-h-screen py-16 text-center text-gray-600 sm:py-20">
        Redirecting…
      </main>
    );
  }

  return (
    <main className="marketplace-shell w-full py-12 sm:py-16 lg:py-24">
      <div className="w-full min-w-0 max-w-2xl">
        <h1 className="text-3xl font-black text-gray-900 lg:text-4xl">Your purchases</h1>
        <p className="mt-2 text-sm text-gray-600">
          {PRICING_MARKETING.plansLine}. We no longer sell monthly or weekly plans — each paid design is a{' '}
          {PRICING_MARKETING.oneTimeShort} one-time checkout.
        </p>

        <div className="mt-8 rounded-2xl border border-[#2563eb]/25 bg-[#2563eb]/5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#2563eb]" aria-hidden />
            <h2 className="font-bold text-gray-900">Download access</h2>
          </div>
          <p className="mt-3 text-sm text-gray-700">
            Paid files you have bought appear under Purchased files. Official flat flags remain free in the gallery.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/purchases"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            Purchased files
            <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-800 transition hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
