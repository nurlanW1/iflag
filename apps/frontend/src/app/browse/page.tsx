import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProductBrowseSection } from '@/components/marketplace/ProductBrowseSection';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `Browse catalog — ${SITE_NAME}`,
  description: `Search, filter, and sort flag assets on ${SITE_NAME}.`,
  alternates: { canonical: '/browse' },
  openGraph: {
    title: `Browse catalog — ${SITE_NAME}`,
    description: `Search, filter, and sort flag assets on ${SITE_NAME}.`,
    url: `${getSiteOrigin()}/browse`,
  },
};

export default function BrowsePage() {
  return (
    <main className="min-h-screen bg-[#fafaf9]">
      <header className="border-b border-stone-200/80 bg-white">
        <div className="marketplace-shell py-8 sm:py-10 lg:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Catalog</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
            Browse flags
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-stone-600 sm:text-base">
            Search by country, design name, or tag. Free official files download without a subscription; paid
            variants require Pro or a one-time purchase.
          </p>
        </div>
      </header>

      <div className="marketplace-shell py-8 sm:py-10 lg:py-12">
        <Suspense fallback={<p className="text-base text-stone-500">Loading catalog…</p>}>
          <ProductBrowseSection />
        </Suspense>
      </div>
    </main>
  );
}
