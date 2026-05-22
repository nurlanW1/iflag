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

/** Premium stock-marketplace PDP — hero preview + elevated sticky acquisition panel + light discovery row. */
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
      <section className="mt-12 border-t border-neutral-300/55 pt-8 md:mt-14 lg:col-span-full" aria-label="Tags">
        <p className="text-[13px] leading-relaxed text-neutral-500">
          {product.tags.map((t, i) => (
            <span key={t} className="inline whitespace-nowrap">
              {i > 0 ? <span className="text-neutral-300"> · </span> : null}
              <Link
                href={`/browse?q=${encodeURIComponent(t)}`}
                className="font-medium text-neutral-600 underline-offset-[3px] transition-colors hover:text-neutral-950 hover:underline"
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
          'marketplace-shell min-w-0 bg-[linear-gradient(180deg,#f4f6f9_0%,#ebeff4_52%,#e8ecf1_100%)] pb-14 pt-10 sm:pt-11 md:pb-16 lg:pb-20 lg:pt-12',
          'max-lg:pb-[calc(18rem+env(safe-area-inset-bottom))]',
        )}
      >
        <div className="mx-auto w-full max-w-[min(100%,1436px)] px-5 sm:px-6 xl:px-8">
          <div className="grid min-w-0 grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,25rem)] xl:grid-cols-[minmax(0,1fr)_26rem] lg:gap-12 xl:gap-16">
            <div className="min-w-0 space-y-7 lg:space-y-10">
              <h1 className="text-[1.85rem] font-bold tracking-[-0.03em] text-neutral-950 sm:text-[2rem] sm:leading-[1.15] lg:hidden">
                {product.title}
              </h1>
              <div
                className="rounded-[1.875rem] bg-gradient-to-br from-white/[0.65] via-white/35 to-transparent p-[0.4375rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_34px_80px_-52px_rgba(15,23,42,0.35)] ring-1 ring-neutral-300/33 sm:p-[0.5rem]"
                aria-label="Hero preview container"
              >
                <PremiumAssetPreview
                  productTitle={product.title}
                  previewUrls={uniquePreview}
                  formatHints={formatHints}
                />
              </div>

              <CountryDesignVariantRibbon variants={siblingPublic} galleryHref={variantGalleryHref} />
            </div>

            <aside className="hidden min-w-0 lg:sticky lg:top-[calc(5.75rem+env(safe-area-inset-top))] lg:z-[20] lg:block lg:self-start">
              <div
                className={clsx(
                  'relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/95 p-8 shadow-[0_32px_80px_-42px_rgba(15,23,42,0.45)] ring-1 ring-neutral-950/[0.04] backdrop-blur-md',
                  'before:pointer-events-none before:absolute before:inset-x-10 before:-top-px before:z-[1] before:h-px before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent',
                )}
              >
                <h1 className="text-[1.725rem] font-bold tracking-[-0.025em] text-neutral-950 sm:text-[1.875rem] sm:leading-[1.18] xl:text-[2rem] xl:tracking-[-0.03em]">
                  {product.title}
                </h1>

                <div className="mt-9 border-t border-neutral-200/95 pt-9">
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
