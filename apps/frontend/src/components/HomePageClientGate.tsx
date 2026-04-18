'use client';

import dynamic from 'next/dynamic';

const HomePageClient = dynamic(() => import('@/components/HomePageClient'), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-dvh items-center justify-center">
        <div
          className="h-12 w-12 animate-spin rounded-full border-2 border-[#009ab6] border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    </main>
  ),
});

export default function HomePageClientGate() {
  return <HomePageClient />;
}
