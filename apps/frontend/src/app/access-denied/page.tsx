'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldOff } from 'lucide-react';

/**
 * Inner: reads ?reason= — must be wrapped in Suspense for next/navigation useSearchParams().
 */
function AccessDeniedContent() {
  const params = useSearchParams();
  const reason = params.get('reason');

  const title = reason === 'config' ? 'Admin not configured' : 'Access denied';
  const message =
    reason === 'config'
      ? 'The site administrator has not configured ADMIN_EMAIL. Admin routes are disabled.'
      : 'Your account does not have access to this area. Contact the site owner if you believe this is a mistake.';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#fafaf9] px-4 py-16">
      <div className="max-w-md rounded-2xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <ShieldOff className="text-red-500" size={28} aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">{message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
          >
            Back to home
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#fafaf9]">
          <p className="text-sm text-neutral-400">Loading…</p>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
