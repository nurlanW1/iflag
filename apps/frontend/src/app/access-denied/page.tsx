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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-16">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-lg">
        <ShieldOff className="mx-auto mb-4 text-red-500" size={48} aria-hidden />
        <h1 className="text-2xl font-black text-gray-900">{title}</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            Back to home
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
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
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-gray-50 to-white">
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
