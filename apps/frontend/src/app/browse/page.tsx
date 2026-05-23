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
    <main className="marketplace-shell min-h-screen w-full py-8 sm:py-12 lg:py-16 xl:py-20">
      <header className="mb-8 sm:mb-10 lg:mb-12">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl md:text-4xl xl:text-5xl">
          Browse catalog
        </h1>
        <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-gray-600 sm:text-base md:text-lg lg:text-xl">
          Search by name, country, or tag—then narrow by taxonomy hub, paid tier filters, or sort order.
        </p>
      </header>
      <Suspense fallback={<p className="text-base text-gray-500">Loading catalog…</p>}>
        <ProductBrowseSection />
      </Suspense>
    </main>
  );
}
