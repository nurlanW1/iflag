import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LegacyFlagDetailPageGate from '@/components/flags/LegacyFlagDetailPageGate';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import { isValidPublicSlug } from '@/lib/seo/slug';
import { buildMarketplaceProductMetadata } from '@/lib/seo/marketplace-product-metadata';
import { SITE_NAME } from '@/lib/seo/site-config';
import { getProductBySlug } from '@/services/marketplace';
import { getNeonGalleryRedirectForProductSlug } from '@/lib/server/neon-catalog';

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
  const neon = await getNeonGalleryRedirectForProductSlug(slug);
  if (neon) {
    return {
      title: `${neon.title} — ${SITE_NAME}`,
      description: `View flag downloads and formats for ${neon.title} on ${SITE_NAME}.`,
      robots: { index: true, follow: true },
    };
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

  const neonRedirect = await getNeonGalleryRedirectForProductSlug(slug);
  if (neonRedirect) {
    redirect(`/gallery/${neonRedirect.gallerySlug}`);
  }

  return <LegacyFlagDetailPageGate />;
}
