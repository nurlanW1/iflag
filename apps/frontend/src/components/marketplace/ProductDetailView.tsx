import clsx from 'clsx';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { PremiumAssetPreview } from '@/components/marketplace/asset-detail/PremiumAssetPreview';
import type { AssetSeoPayload } from '@/lib/seo/asset-metadata';
import { marketplaceProductCanonicalPath } from '@/lib/seo/marketplace-product-metadata';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structured-data';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import { dedupePublicProductFiles, isPaidCatalogProduct } from '@/lib/marketplace/catalog-utils';
import { NeonAssetDownloads } from '@/components/marketplace/NeonAssetDownloads';
import { PremiumCatalogCommerce } from '@/components/marketplace/PremiumCatalogCommerce';
import type { Product } from '@/types/marketplace';

import { CountryDesignVariantRibbon } from '@/components/marketplace/CountryDesignVariantRibbon';
import { listPublishedProducts } from '@/services/marketplace';

type Props = {
  slug: string;
  product: Product;
};

/** Other published designs for this country — prefer different bundle keys for variety. */
function listCountryVariants(current: Product, limit = 14): Product[] {
  const cs = current.countrySlug?.trim().toLowerCase();
  if (!cs) return [];
  const agkNorm = current.assetGroupKey?.trim().toLowerCase() ?? '';
  const sameAgkGroup = (p: Product) => (p.assetGroupKey?.trim().toLowerCase() ?? '') === agkNorm && agkNorm !== '';
  return listPublishedProducts({})
    .filter((p) => p.slug !== current.slug && p.countrySlug?.trim().toLowerCase() === cs)
    .sort((a, b) => {
      const deprioritized = Number(sameAgkGroup(a)) - Number(sameAgkGroup(b));
      if (deprioritized !== 0) return deprioritized;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

/** Stock-marketplace PDP: grey preview stage + white sticky action card + keyword row (adapted from Freepik-style layout). */
export function ProductDetailView({ slug, product }: Props) {
  const publicProduct = toPublicProduct(product);
  const dedupedFiles = dedupePublicProductFiles(publicProduct.files);
  const paid = isPaidCatalogProduct(publicProduct);
  const previewFileDomain = product.files.find(
    (f) => f.tier === 'preview_free' && f.publicUrl != null && String(f.publicUrl).trim() !== '',
  );
  const previewFilePublic =
    previewFileDomain != null ? dedupedFiles.find((f) => f.id === previewFileDomain.id) ?? null : null;

  const neonDownloads = Boolean((product.detailPath ?? '').startsWith('/assets/'));

  const canonicalPath =
    product.seo.canonicalPath?.trim() || marketplaceProductCanonicalPath(product.slug);

  const seoPayload: AssetSeoPayload = {
    title: product.seo.metaTitle || product.title,
    description: product.seo.metaDescription || product.description,
    image: product.seo.ogImageUrl || product.previewUrl || product.thumbnailUrl,
    canonicalPath,
    priceCents: product.priceCents,
    currency: product.currency,
  };

  const previewImages = [publicProduct.previewUrl, publicProduct.thumbnailUrl].filter(
    (u): u is string => typeof u === 'string' && u.length > 0,
  );
  const uniquePreview = [...new Set(previewImages)];
  const formatHints = dedupedFiles.map((f) => f.format);
  const licenseHint = product.license?.summary?.trim() || null;

  const siblingProducts = listCountryVariants(product);
  const siblingPublic = siblingProducts.map(toPublicProduct);
  const variantGalleryHref = product.countrySlug?.trim()
    ? `/gallery/${encodeURIComponent(product.countrySlug.trim().toLowerCase())}`
    : null;

  const tagPills =
    product.tags.length > 0 ? (
      <section className="mt-14 border-t border-neutral-200/70 pt-10 md:mt-16" aria-label="Related keywords">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Related keywords</h2>
        <div className="mt-4 flex flex-wrap gap-2">{/* subtle grey chips like marketplace references */}
          {product.tags.map((t) => (
            <Link
              key={t}
              href={`/browse?q=${encodeURIComponent(t)}`}
              className="inline-flex max-w-[14rem] truncate rounded-full border border-transparent bg-neutral-200/65 px-[0.875rem] py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:border-neutral-300/80 hover:bg-neutral-300/55 hover:text-neutral-900"
            >
              {t}
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(slug, seoPayload, publicProduct),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Browse', path: '/browse' },
            { name: product.title, path: canonicalPath },
          ]),
        ]}
      />
      <main
        className={clsx(
          'marketplace-shell bg-neutral-100 pt-8 sm:pt-10 md:pb-14 lg:pb-16',
          'max-md:pb-[calc(13rem+env(safe-area-inset-bottom))]',
        )}
      >
        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_23rem] xl:gap-14">
          <section aria-label="Preview" className="min-w-0">
            <PremiumAssetPreview
              productTitle={product.title}
              previewUrls={uniquePreview}
              formatHints={formatHints}
            />
            <CountryDesignVariantRibbon variants={siblingPublic} galleryHref={variantGalleryHref} />
          </section>

          <aside className="min-w-0 lg:sticky lg:top-[4.85rem] lg:self-start">
            <div className="rounded-xl border border-neutral-200/95 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-[1.35rem]">
              <h1 className="text-[1.28rem] font-bold leading-snug tracking-tight text-neutral-900 sm:text-[1.375rem]">
                {product.title}
              </h1>
              <div className="mt-1 border-t border-neutral-100 pt-5">
                {neonDownloads ? (
                  <NeonAssetDownloads files={dedupedFiles} licenseHint={licenseHint} />
                ) : (
                  <PremiumCatalogCommerce
                    productId={product.id}
                    productSlug={product.slug}
                    currency={publicProduct.currency}
                    paidCatalog={paid}
                    files={dedupedFiles}
                    previewFile={previewFilePublic}
                    licenseHint={licenseHint}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>

        {tagPills}
      </main>
    </>
  );
}
