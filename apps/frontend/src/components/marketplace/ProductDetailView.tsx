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
  const sameAgkGroup = (p: Product) =>
    (p.assetGroupKey?.trim().toLowerCase() ?? '') === agkNorm && agkNorm !== '';
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

/** Asset download / PDP — balanced hero + sticky card, slate system + brand CTA. */
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

  const siblingProducts = listCountryVariants(product);
  const siblingPublic = siblingProducts.map(toPublicProduct);
  const variantGalleryHref = product.countrySlug?.trim()
    ? `/gallery/${encodeURIComponent(product.countrySlug.trim().toLowerCase())}`
    : null;

  const tagTrail =
    product.tags.length > 0 ? (
      <section className="mt-10 border-t border-slate-200/80 pt-7 md:mt-12 lg:col-span-full" aria-label="Tags">
        <p className="text-[12px] leading-relaxed text-slate-500">
          {product.tags.map((t, i) => (
            <span key={t} className="inline whitespace-nowrap">
              {i > 0 ? <span className="text-slate-300"> · </span> : null}
              <Link
                href={`/browse?q=${encodeURIComponent(t)}`}
                className="font-medium text-slate-600 underline-offset-2 transition-colors hover:text-[var(--brand-blue)] hover:underline"
              >
                {t}
              </Link>
            </span>
          ))}
        </p>
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
          'marketplace-shell min-w-0 bg-slate-50 pb-14 pt-9 sm:pt-10 md:pb-16 lg:pb-[4.25rem] lg:pt-11',
          'max-lg:pb-[calc(17rem+env(safe-area-inset-bottom))]',
        )}
      >
        <div className="mx-auto w-full max-w-[min(100%,1380px)] px-5 sm:px-6 xl:px-10">
          <div className="grid min-w-0 grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] xl:grid-cols-[minmax(0,1fr)_25rem] lg:gap-11 xl:gap-14">
            <div className="min-w-0 space-y-8 lg:space-y-10">
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-[1.875rem] sm:leading-snug lg:hidden">
                {product.title}
              </h1>
              <div className="min-w-0" aria-label="Hero preview">
                <PremiumAssetPreview
                  productTitle={product.title}
                  previewUrls={uniquePreview}
                  formatHints={formatHints}
                />
              </div>

              <CountryDesignVariantRibbon variants={siblingPublic} galleryHref={variantGalleryHref} />
            </div>

            <aside className="hidden min-w-0 lg:sticky lg:top-[calc(5.25rem+env(safe-area-inset-top))] lg:z-[20] lg:block lg:self-start">
              <div
                className={clsx(
                  'rounded-2xl border border-white/80 bg-white p-7 xl:p-8',
                  'shadow-[0_24px_60px_-32px_rgba(15,23,42,0.22)]',
                  'ring-1 ring-slate-200/60',
                )}
              >
                <div className="mb-6 h-0.5 w-10 rounded-full bg-gradient-to-r from-[var(--brand-blue)] to-slate-200" aria-hidden />
                <h1 className="text-[1.625rem] font-semibold tracking-[-0.025em] text-slate-900 xl:text-[1.75rem] xl:leading-tight">
                  {product.title}
                </h1>

                <div className="mt-8 border-t border-slate-100 pt-8">
                  {neonDownloads ? (
                    <NeonAssetDownloads files={dedupedFiles} />
                  ) : (
                    <PremiumCatalogCommerce
                      productId={product.id}
                      productSlug={product.slug}
                      currency={publicProduct.currency}
                      paidCatalog={paid}
                      files={dedupedFiles}
                      previewFile={previewFilePublic}
                    />
                  )}
                </div>
              </div>
            </aside>

            {tagTrail}
          </div>
        </div>
      </main>
    </>
  );
}
