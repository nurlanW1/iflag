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
    <main className="marketplace-shell min-h-screen w-full py-12 sm:py-14 lg:py-20">
      <header className="mb-10 lg:mb-12">
        <h1 className="text-3xl font-black text-gray-900 md:text-4xl xl:text-5xl">Browse catalog</h1>
        <p className="mt-3 w-full max-w-none text-sm text-gray-600 md:text-base xl:text-lg">
          Search by name, country, or tag. Filter by category, free vs pro, and free preview availability.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading catalog…</p>}>
        <ProductBrowseSection />
      </Suspense>
    </main>
  );
}
