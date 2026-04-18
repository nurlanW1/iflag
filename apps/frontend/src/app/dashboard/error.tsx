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
      <h1 className="text-xl font-bold text-gray-900">Dashboard unavailable</h1>
      <p className="mt-2 text-sm text-gray-600">
        Something went wrong loading this page. Your session may still be valid—try again or return to the
        overview.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-[#009ab6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a8a]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Overview
        </Link>
      </div>
    </div>
  );
}
