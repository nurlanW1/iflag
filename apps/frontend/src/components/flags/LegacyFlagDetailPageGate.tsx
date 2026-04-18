'use client';

import dynamic from 'next/dynamic';

const LegacyFlagDetailPage = dynamic(
  () => import('@/components/flags/LegacyFlagDetailPage'),
  {
    ssr: false,
    loading: () => (
      <main className="px-4 py-16">
        <div className="container mx-auto text-center">
          <div className="spinner mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading flag…</p>
        </div>
      </main>
    ),
  }
);

export default function LegacyFlagDetailPageGate() {
  return <LegacyFlagDetailPage />;
}
