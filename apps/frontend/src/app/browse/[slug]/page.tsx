import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { isValidPublicSlug } from '@/lib/seo/slug';
import { buildMarketplaceProductMetadata, marketplaceProductCanonicalPath } from '@/lib/seo/marketplace-product-metadata';
import { getProductBySlug } from '@/services/marketplace';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    return { title: 'Not found' };
  }
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: 'Not found' };
  }
  const meta = buildMarketplaceProductMetadata(product);
  return {
    ...meta,
    alternates: {
      canonical: marketplaceProductCanonicalPath(product.slug),
    },
  };
}

export default async function BrowseProductPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    notFound();
  }
  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }
  permanentRedirect(marketplaceProductCanonicalPath(product.slug));
}
