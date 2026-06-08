'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50/50 px-6 py-8 text-center">
      <h1 className="text-xl font-semibold text-[#2a2a2a]">Dashboard unavailable</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Something went wrong loading this page. Your session may still be valid — try again or return to the
        overview.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
        >
          Overview
        </Link>
      </div>
    </div>
  );
}
