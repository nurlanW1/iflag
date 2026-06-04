'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, ExternalLink } from 'lucide-react';

interface Sub {
  isActive: boolean;
  plan: string;
  expiresAt: string | null;
}

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then((r) => r.json())
      .then((d) => setSub(d.subscription ?? { isActive: false, plan: 'free', expiresAt: null }))
      .catch(() => setSub({ isActive: false, plan: 'free', expiresAt: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-stone-200" />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb]/10 text-[#2563eb]">
            <CreditCard size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Current Plan</p>
            <p className="text-xl font-bold text-stone-900 capitalize">
              {sub?.isActive ? sub.plan : 'Free'}
            </p>
          </div>
          {sub?.isActive && (
            <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active
            </span>
          )}
        </div>

        {sub?.expiresAt && (
          <p className="mt-4 text-sm text-stone-500">
            Renews: {new Date(sub.expiresAt).toLocaleDateString()}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {!sub?.isActive && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Upgrade plan
            </Link>
          )}
          {sub?.isActive && (
            <Link
              href="/api/billing/portal"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <ExternalLink size={14} />
              Manage billing
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
