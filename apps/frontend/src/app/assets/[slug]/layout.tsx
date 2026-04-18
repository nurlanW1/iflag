import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import { resolveAssetSeoBySlug, isValidPublicSlug } from '@/lib/seo';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structured-data';
import { getProductBySlug } from '@/services/marketplace';

/**
 * Same product detail as /flags/[slug]; canonical URL points to /flags/[slug] to consolidate signals.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    return { title: 'Not found' };
  }
  const payload = await resolveAssetSeoBySlug(slug);
  if (!payload) {
    return {
      title: 'Flag asset',
      description: `View this flag asset on ${SITE_NAME}.`,
    };
  }
  const canonical = `/flags/${slug}`;
  return {
    title: payload.title,
    description: payload.description || `Download ${payload.title} on ${SITE_NAME}.`,
    alternates: { canonical },
    openGraph: {
      title: payload.title,
      description: payload.description || undefined,
      url: `${getSiteOrigin()}${canonical}`,
      images: payload.image ? [{ url: payload.image, alt: `${payload.title} — ${SITE_NAME}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: payload.title,
      description: payload.description || undefined,
      images: payload.image ? [payload.image] : undefined,
    },
  };
}

export default async function AssetDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidPublicSlug(slug)) {
    return children;
  }
  const payload = await resolveAssetSeoBySlug(slug);
  if (!payload) {
    return children;
  }
  const local = getProductBySlug(slug);
  const publicProduct = local ? toPublicProduct(local) : null;
  const canonicalPath = `/flags/${slug}`;

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(slug, payload, publicProduct),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Assets', path: '/assets' },
            { name: payload.title, path: canonicalPath },
          ]),
        ]}
      />
      {children}
    </>
  );
}
