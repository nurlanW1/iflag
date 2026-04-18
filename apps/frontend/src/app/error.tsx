'use client';

import { useEffect } from 'react';

export default function RootError({
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
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-2xl font-black text-gray-900">Something went wrong</h1>
      <p className="text-sm text-gray-600">
        An unexpected error occurred. You can try again, or return home if the problem continues.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-[#009ab6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#007a8a]"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Home
        </a>
      </div>
    </div>
  );
}
