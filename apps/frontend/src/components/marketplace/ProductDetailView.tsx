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
import { getCategoryById, listPublishedProducts } from '@/services/marketplace';

type Props = {
  slug: string;
  product: Product;
};

function humanizeCountry(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

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

function formatHintsMayHaveAlpha(hints: string[]): boolean {
  return hints.some((h) => {
    const k = h.replace(/^\./, '').toLowerCase();
    return ['png', 'webp', 'svg', 'gif'].includes(k);
  });
}

/** PDP — premium preview + sticky download glass card (scoped to this page only). */
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
  const cartPathname = neonDownloads ? `/assets/${product.slug}` : marketplaceProductCanonicalPath(product.slug);

  const cartProduct = {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    pathname: cartPathname,
  };

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

  const categoryName = getCategoryById(product.categoryId)?.name ?? 'Flags';

  const siblingProducts = listCountryVariants(product);
  const siblingPublic = siblingProducts.map(toPublicProduct);
  const variantGalleryHref = product.countrySlug?.trim()
    ? `/gallery/${encodeURIComponent(product.countrySlug.trim().toLowerCase())}`
    : null;

  const licenseSummary = product.license?.summary?.trim() || null;
  const countryLine = product.countrySlug?.trim() ? humanizeCountry(product.countrySlug.trim()) : null;

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

  const breadcrumbsDesktop = (
    <nav aria-label="Breadcrumb" className="mb-5 hidden flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:flex">
      <Link href="/" className="text-slate-500 transition-colors hover:text-[var(--brand-blue)]">
        Home
      </Link>
      <span aria-hidden className="text-slate-300">
        /
      </span>
      <Link href="/browse" className="text-slate-500 transition-colors hover:text-[var(--brand-blue)]">
        Browse
      </Link>
      <span aria-hidden className="text-slate-300">
        /
      </span>
      <span className="max-w-[12rem] truncate text-slate-600">{categoryName}</span>
    </nav>
  );

  const metaEyebrow = (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium leading-snug text-slate-500">
      <span className="rounded-md bg-[var(--brand-blue-soft)]/80 px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-blue-muted)] ring-1 ring-[var(--brand-blue)]/[0.12]">
        {categoryName}
      </span>
      {countryLine ? (
        <>
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          <span>{countryLine}</span>
        </>
      ) : null}
    </p>
  );

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
          'marketplace-shell min-w-0 bg-slate-50 pb-14 pt-9 sm:pt-10 md:pb-16 lg:pb-[4.75rem] lg:pt-11',
          'max-lg:pb-[calc(21rem+env(safe-area-inset-bottom)+var(--cookie-banner-h,0px))]',
        )}
      >
        <div className="mx-auto w-full max-w-[min(100%,1392px)] px-5 sm:px-6 xl:px-10">
          <div className="min-w-0 space-y-10 lg:space-y-11">
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-[1.95rem] sm:leading-snug lg:hidden">
              {product.title}
            </h1>

            <div
              className={clsx(
                'grid min-w-0 grid-cols-1 gap-6',
                'lg:grid-cols-[minmax(0,1fr)_minmax(18.75rem,24rem)] lg:items-stretch lg:gap-5',
                'xl:grid-cols-[minmax(0,1fr)_25rem] xl:gap-6',
              )}
            >
              <div className="flex min-h-0 min-w-0 flex-col lg:h-auto lg:min-h-[26rem]" aria-label="Hero preview">
                <PremiumAssetPreview
                  productTitle={product.title}
                  previewUrls={uniquePreview}
                  formatHints={formatHints}
                  useTransparencyBackdrop={formatHintsMayHaveAlpha(formatHints)}
                  fillColumn
                />
              </div>

              <aside className="hidden min-h-0 min-w-0 lg:block lg:h-auto lg:self-stretch lg:sticky lg:top-[calc(5rem+env(safe-area-inset-top))] lg:z-[20]">
                <div
                  className={clsx(
                    'flex h-full min-h-[26rem] flex-col rounded-[1.375rem]',
                    'border border-slate-200/80 bg-white p-[1.6rem]',
                    'backdrop-blur-[14px]',
                  )}
                >
                  {breadcrumbsDesktop}
                  <h1 className="text-[1.65rem] font-semibold tracking-[-0.028em] text-slate-900 xl:text-[1.8rem] xl:leading-[1.2]">
                    {product.title}
                  </h1>
                  {metaEyebrow}
                  <div className="my-8 h-px bg-gradient-to-r from-slate-200/20 via-slate-200/90 to-slate-200/20" />

                  <div className="min-h-0 flex-1">
                    {neonDownloads ? (
                      <NeonAssetDownloads
                        cartProduct={cartProduct}
                        files={dedupedFiles}
                        licenseSummary={licenseSummary}
                      />
                    ) : (
                      <PremiumCatalogCommerce
                        cartProduct={cartProduct}
                        productId={product.id}
                        productSlug={product.slug}
                        currency={publicProduct.currency}
                        paidCatalog={paid}
                        files={dedupedFiles}
                        previewFile={previewFilePublic}
                        licenseSummary={licenseSummary}
                      />
                    )}
                  </div>
                </div>
              </aside>

              <div className="min-w-0 lg:col-span-full">
                <CountryDesignVariantRibbon variants={siblingPublic} galleryHref={variantGalleryHref} />
              </div>

              {tagTrail ? <div className="min-w-0 lg:col-span-full">{tagTrail}</div> : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
