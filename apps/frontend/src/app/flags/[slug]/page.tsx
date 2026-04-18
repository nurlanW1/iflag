import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import { isValidPublicSlug } from '@/lib/seo/slug';
import { buildMarketplaceProductMetadata } from '@/lib/seo/marketplace-product-metadata';
import { SITE_NAME } from '@/lib/seo/site-config';
import { getProductBySlug } from '@/services/marketplace';

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

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    return { title: 'Not found' };
  }
  const product = getProductBySlug(slug);
  if (product) {
    return buildMarketplaceProductMetadata(product);
  }
  return {
    title: `Flag asset | ${SITE_NAME}`,
    description: `View flag asset details on ${SITE_NAME}.`,
    robots: { index: true, follow: true },
  };
}

export default async function FlagProductPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    notFound();
  }

  const product = getProductBySlug(slug);
  if (product) {
    return <ProductDetailView slug={slug} product={product} />;
  }

  return <LegacyFlagDetailPage />;
}
