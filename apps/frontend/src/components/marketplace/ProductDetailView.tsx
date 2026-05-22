import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { PremiumAssetPreview } from '@/components/marketplace/asset-detail/PremiumAssetPreview';
import { FlagEducationalSections } from '@/components/marketplace/FlagEducationalSections';
import type { AssetSeoPayload } from '@/lib/seo/asset-metadata';
import { marketplaceProductCanonicalPath } from '@/lib/seo/marketplace-product-metadata';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structured-data';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import {
  formatPrice,
  collectFormatLabels,
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
  const formatLabels = collectFormatLabels(dedupedFiles);

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
      <main className="marketplace-shell bg-[linear-gradient(180deg,#fafaf9_0%,#fff_52%,#f4f7f9_100%)] pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-10 sm:pt-12 lg:pb-14 lg:pt-14">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-neutral-500">
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

        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(336px,28rem)] lg:items-start xl:gap-14 2xl:gap-[4.25rem]">
          <section aria-label="Product preview" className="min-w-0 space-y-10">
            <PremiumAssetPreview
              productTitle={product.title}
              previewUrls={uniquePreview}
              formatHints={formatHints}
            />

            {product.description ? (
              <div className="max-w-[52rem]">
                <h2 className="text-xl font-semibold tracking-tight text-neutral-950">Overview</h2>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-neutral-600">
                  {product.description}
                </p>
              </div>
            ) : (
              <p className="max-w-[52rem] text-sm leading-relaxed text-neutral-600">
                Previews use lightweight raster exports; original vectors and print masters ship only through the
                format selector.
              </p>
            )}

            <FlagEducationalSections productTitle={product.title} />
          </section>

          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.65rem] border border-neutral-200/90 bg-white/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_28px_80px_-40px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04] sm:p-7 xl:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">{categoryName}</p>

              <h1 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-neutral-950 sm:text-4xl">
                {product.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-600">
                {product.countrySlug ? (
                  <Link
                    href={`/gallery/${encodeURIComponent(product.countrySlug)}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm ring-1 ring-neutral-200/90 transition hover:ring-neutral-300"
                  >
                    <MapPinned className="h-3.5 w-3.5 text-[var(--brand-blue)]" aria-hidden />
                    {countryLabel ?? product.countrySlug}
                  </Link>
                ) : countryLabel ? (
                  <span className="rounded-full px-3 py-1 text-xs font-semibold text-neutral-700">{countryLabel}</span>
                ) : null}
                <span aria-hidden className="text-neutral-300">
                  •
                </span>
                <span>
                  Available in <strong className="font-semibold text-neutral-900">{formatLabels.length}</strong> format
                  {formatLabels.length === 1 ? '' : 's'}
                </span>
                {product.countryCode ? (
                  <>
                    <span aria-hidden className="text-neutral-300">
                      •
                    </span>
                    <span className="font-mono text-xs font-semibold uppercase text-neutral-500">{product.countryCode}</span>
                  </>
                ) : null}
              </div>

              {product.assetGroupKey ? (
                <p className="mt-3 font-mono text-[11px] text-neutral-500">
                  Design key{' '}
                  <span className="rounded-md bg-neutral-50 px-2 py-0.5 ring-1 ring-neutral-200">
                    {product.assetGroupKey}
                  </span>
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  {formatPrice(publicProduct.priceCents, publicProduct.currency)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-2 ${
                    paid
                      ? 'bg-[var(--brand-blue)] text-white ring-[var(--brand-blue)]/40'
                      : 'bg-emerald-600 text-white ring-emerald-500/40'
                  }`}
                >
                  {paid ? (
                    <span className="inline-flex items-center gap-1">
                      <Crown size={13} aria-hidden /> Premium
                    </span>
                  ) : (
                    'Free'
                  )}
                </span>
              </div>

              <div className="mt-6">
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

              {product.license?.summary ? (
                <div className="mt-8 border-t border-dashed border-neutral-200 pt-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">License</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{product.license.summary}</p>
                </div>
              ) : null}

              {product.tags.length > 0 ? (
                <div className="mt-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Tags</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {product.tags.map((t) => (
                      <li key={t}>
                        <Link
                          href={`/browse?q=${encodeURIComponent(t)}`}
                          className="inline-flex rounded-full bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200/90 transition hover:ring-neutral-300"
                        >
                          {t}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-8 border-t border-dashed border-neutral-200 pt-6">
                <Link
                  href="/pricing"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
                >
                  <Crown size={18} aria-hidden />
                  View subscription &amp; billing
                </Link>
                <p className="mt-2 text-center text-xs text-neutral-500">
                  Paddle-secured checkout — unlock pro masters or gallery-wide access.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {relatedPublic.length > 0 ? (
          <section className="mt-16 border-t border-neutral-200/90 pt-12" aria-labelledby="related-heading">
            <div className="max-w-3xl space-y-1">
              <h2 id="related-heading" className="text-2xl font-semibold tracking-tight text-neutral-950">
                Similar flags
              </h2>
              <p className="text-sm text-neutral-600">
                Curated from {categoryName}
                {product.countrySlug
                  ? ` — prioritizing ${countryLabel ?? titleCaseFromSlug(product.countrySlug)}`
                  : ''}
                .
              </p>
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
