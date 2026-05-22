import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import LegacyRailsAssetDetailPage from '@/components/assets/LegacyRailsAssetDetailPage';
import { isValidPublicSlug } from '@/lib/seo/slug';
import { buildMarketplaceProductMetadata } from '@/lib/seo/marketplace-product-metadata';
import { SITE_NAME, getSiteOrigin } from '@/lib/seo/site-config';
import { resolveAssetSeoBySlug } from '@/lib/seo';
import { resolvePublishedMarketplaceProduct } from '@/lib/server/resolve-published-marketplace-product';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    return { title: 'Not found' };
  }
  const product = await resolvePublishedMarketplaceProduct(slug);
  if (product) {
    return buildMarketplaceProductMetadata(product);
  }
  const legacy = await resolveAssetSeoBySlug(slug);
  if (legacy) {
    const canonical = legacy.canonicalPath?.trim() || `/assets/${slug}`;
    return {
      title: legacy.title,
      description: legacy.description || `Download ${legacy.title} on ${SITE_NAME}.`,
      alternates: { canonical },
      openGraph: {
        title: legacy.title,
        description: legacy.description || undefined,
        url: `${getSiteOrigin()}${canonical}`,
        images: legacy.image ? [{ url: legacy.image, alt: `${legacy.title} — ${SITE_NAME}` }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: legacy.title,
        description: legacy.description || undefined,
        images: legacy.image ? [legacy.image] : undefined,
      },
    };
  }
  return {
    title: `Asset | ${SITE_NAME}`,
    description: `View this asset on ${SITE_NAME}.`,
  };
}

export default async function AssetMarketplaceOrLegacyPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    notFound();
  }
  const product = await resolvePublishedMarketplaceProduct(slug);
  if (product) {
    return <ProductDetailView slug={product.slug} product={product} />;
  }
  return <LegacyRailsAssetDetailPage slug={slug} />;
}
