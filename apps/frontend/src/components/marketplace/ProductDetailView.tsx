import Link from 'next/link';
import clsx from 'clsx';
import { JsonLd } from '@/components/seo/JsonLd';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { PremiumAssetPreview } from '@/components/marketplace/asset-detail/PremiumAssetPreview';
import type { AssetSeoPayload } from '@/lib/seo/asset-metadata';
import { marketplaceProductCanonicalPath } from '@/lib/seo/marketplace-product-metadata';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structured-data';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import {
  formatPrice,
  dedupePublicProductFiles,
  isPaidCatalogProduct,
} from '@/lib/marketplace/catalog-utils';
import { getCategoryById, listPublishedProducts } from '@/services/marketplace';
import { NeonAssetDownloads } from '@/components/marketplace/NeonAssetDownloads';
import { PremiumCatalogCommerce } from '@/components/marketplace/PremiumCatalogCommerce';
import { Crown, MapPinned } from 'lucide-react';
import type { Product } from '@/types/marketplace';

type Props = {
  slug: string;
  product: Product;
};

function titleCaseFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Prefer same-country cards, then widen to category without duplicating sibling items. */
function pickSimilarProducts(current: Product, limit: number): Product[] {
  const pool = listPublishedProducts({ categoryId: current.categoryId }).filter((p) => p.slug !== current.slug);
  const cs = (current.countrySlug ?? '').trim().toLowerCase();
  if (!cs) return pool.slice(0, limit);
  const same = pool.filter((p) => (p.countrySlug ?? '').trim().toLowerCase() === cs);
  const other = pool.filter((p) => (p.countrySlug ?? '').trim().toLowerCase() !== cs);
  return [...same, ...other].slice(0, limit);
}

/** PDP related grid — 4 cols desktop scaling to 6 on wide screens */
const SIMILAR_FLAG_GRID_CLASSES =
  'grid min-w-0 grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-6 xl:grid-cols-4 xl:gap-7 2xl:grid-cols-6 2xl:gap-8';

export function ProductDetailView({ slug, product }: Props) {
  const publicProduct = toPublicProduct(product);
  const dedupedFiles = dedupePublicProductFiles(publicProduct.files);
  const category = getCategoryById(product.categoryId);
  const categoryName = category?.name ?? 'Catalog';
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

  const related = pickSimilarProducts(product, 12);
  const relatedPublic = related.map((p) => ({
    product: toPublicProduct(p),
    categoryName: getCategoryById(p.categoryId)?.name ?? categoryName,
  }));

  const previewImages = [publicProduct.previewUrl, publicProduct.thumbnailUrl].filter(
    (u): u is string => typeof u === 'string' && u.length > 0,
  );
  const uniquePreview = [...new Set(previewImages)];
  const formatHints = dedupedFiles.map((f) => f.format);
  const countryLabel = product.countrySlug ? titleCaseFromSlug(product.countrySlug) : null;

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
          'marketplace-shell bg-neutral-50 pt-8 sm:pt-10 md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pt-12 lg:pb-12',
          'max-md:pb-[15.5rem]',
        )}
      >
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-neutral-500 md:mb-7">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="font-semibold text-[var(--brand-blue)] hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li>
              <Link href="/browse" className="font-semibold text-[var(--brand-blue)] hover:underline">
                Browse
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li className="max-w-[min(100vw-6rem,28rem)] truncate font-semibold text-neutral-900">{product.title}</li>
          </ol>
        </nav>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,22.5rem)] lg:items-start lg:gap-10 xl:gap-12">
          <section aria-label="Product preview" className="min-w-0 space-y-6 md:space-y-8">
            <PremiumAssetPreview
              productTitle={product.title}
              previewUrls={uniquePreview}
              formatHints={formatHints}
            />

            {product.description ? (
              <div className="max-w-[52rem]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 md:text-[0.9375rem]">
                  {product.description}
                </p>
              </div>
            ) : null}
          </section>

          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.12)] sm:p-6">
              <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-neutral-950 sm:text-[1.85rem]">
                {product.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2 gap-y-2">
                {product.countrySlug ? (
                  <Link
                    href={`/gallery/${encodeURIComponent(product.countrySlug)}`}
                    className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-[13px] font-medium text-neutral-800 transition hover:bg-neutral-200"
                  >
                    <MapPinned className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
                    {countryLabel ?? product.countrySlug}
                  </Link>
                ) : countryLabel ? (
                  <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-[13px] font-medium text-neutral-800">
                    {countryLabel}
                  </span>
                ) : null}
                <span
                  className={clsx(
                    'inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                    paid ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white',
                  )}
                >
                  {paid ? (
                    <span className="inline-flex items-center gap-1">
                      <Crown size={12} aria-hidden /> Premium
                    </span>
                  ) : (
                    'Free'
                  )}
                </span>
                <span className="text-[15px] font-semibold tabular-nums text-neutral-900">
                  {formatPrice(publicProduct.priceCents, publicProduct.currency)}
                </span>
              </div>

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

              {product.license?.summary ? (
                <p className="mt-6 line-clamp-2 border-t border-neutral-100 pt-5 text-[12px] leading-snug text-neutral-500">
                  {product.license.summary}
                </p>
              ) : null}

              {product.tags.length > 0 ? (
                <p className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-neutral-100 pt-5 text-[12px] text-neutral-500">
                  {product.tags.map((t, i) => (
                    <span key={t} className="inline-flex items-center gap-x-1">
                      {i > 0 ? <span aria-hidden>·</span> : null}
                      <Link href={`/browse?q=${encodeURIComponent(t)}`} className="hover:text-neutral-900 hover:underline">
                        {t}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}

              <div className="mt-6 border-t border-neutral-100 pt-5">
                <Link href="/pricing" className="text-[13px] font-semibold text-slate-900 underline-offset-4 hover:underline">
                  Plans &amp; billing
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {relatedPublic.length > 0 ? (
          <section className="mt-12 border-t border-neutral-200/80 pt-10 md:mt-14 md:pt-12" aria-labelledby="related-heading">
            <div>
              <h2 id="related-heading" className="text-xl font-semibold tracking-tight text-neutral-950 md:text-[1.375rem]">
                Similar assets
              </h2>
            </div>
            <ul className={`mt-10 ${SIMILAR_FLAG_GRID_CLASSES}`}>
              {relatedPublic.map(({ product: rp, categoryName: cn }) => (
                <li key={rp.id} className="min-h-0">
                  <MarketplaceProductCard product={rp} categoryName={cn} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
