import Image from 'next/image';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { FlagEducationalSections } from '@/components/marketplace/FlagEducationalSections';
import type { AssetSeoPayload } from '@/lib/seo/asset-metadata';
import { marketplaceProductCanonicalPath } from '@/lib/seo/marketplace-product-metadata';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structured-data';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import {
  formatPrice,
  collectFormatLabels,
  isPaidCatalogProduct,
} from '@/lib/marketplace/catalog-utils';
import { getCategoryById, listPublishedProducts } from '@/services/marketplace';
import { LemonSqueezyCheckoutButton } from '@/components/billing/LemonSqueezyCheckoutButton';
import { Crown, Download } from 'lucide-react';
import type { Product } from '@/types/marketplace';

type Props = {
  slug: string;
  product: Product;
};

export function ProductDetailView({ slug, product }: Props) {
  const publicProduct = toPublicProduct(product);
  const category = getCategoryById(product.categoryId);
  const categoryName = category?.name ?? 'Catalog';
  const paid = isPaidCatalogProduct(publicProduct);
  const formatLabels = collectFormatLabels(publicProduct.files);

  const canonicalPath = marketplaceProductCanonicalPath(product.slug);

  const seoPayload: AssetSeoPayload = {
    title: product.seo.metaTitle || product.title,
    description: product.seo.metaDescription || product.description,
    image: product.seo.ogImageUrl || product.previewUrl || product.thumbnailUrl,
    canonicalPath,
    priceCents: product.priceCents,
    currency: product.currency,
  };

  const related = listPublishedProducts({ categoryId: product.categoryId })
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);
  const relatedPublic = related.map((p) => ({
    product: toPublicProduct(p),
    categoryName: getCategoryById(p.categoryId)?.name ?? categoryName,
  }));

  const previewImages = [publicProduct.previewUrl, publicProduct.thumbnailUrl].filter(
    (u): u is string => typeof u === 'string' && u.length > 0
  );
  const uniquePreview = [...new Set(previewImages)];

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
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="text-[#009ab6] hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/browse" className="text-[#009ab6] hover:underline">
                Browse
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-gray-900">{product.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,24rem)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#009ab6]">{categoryName}</p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 md:text-4xl">{product.title}</h1>
            <p className="mt-3 text-sm text-gray-600">
              Flag asset for creative projects. License terms apply per file and checkout; see sidebar for
              formats and downloads.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-black text-gray-900">
                {formatPrice(publicProduct.priceCents, publicProduct.currency)}
              </span>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                  paid ? 'bg-[#009ab6] text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {paid ? (
                  <span className="inline-flex items-center gap-1">
                    <Crown size={12} className="shrink-0" aria-hidden />
                    Pro
                  </span>
                ) : (
                  'Free'
                )}
              </span>
            </div>

            {uniquePreview.length > 0 ? (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {uniquePreview.map((src, i) => (
                  <li
                    key={src}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                  >
                    <Image
                      src={src}
                      alt={i === 0 ? `${product.title} flag` : `${product.title} flag preview ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={i === 0}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                No preview images for this product yet.
              </p>
            )}

            {product.description ? (
              <div className="mt-10 max-w-none">
                <h2 className="text-lg font-bold text-gray-900">About this flag</h2>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-700">
                  {product.description}
                </p>
              </div>
            ) : null}

            <FlagEducationalSections productTitle={product.title} />

            {product.tags.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-sm font-bold text-gray-900">Tags</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <li key={t}>
                      <Link
                        href={`/browse?q=${encodeURIComponent(t)}`}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                      >
                        {t}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="h-fit space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <div>
              <h2 className="text-sm font-bold text-gray-900">File formats</h2>
              {formatLabels.length > 0 ? (
                <p className="mt-2 text-sm text-gray-600">{formatLabels.join(' · ')}</p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Formats listed per file below.</p>
              )}
              <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
                {publicProduct.files
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((f) => (
                    <li
                      key={f.id}
                      className="flex justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-gray-800"
                    >
                      <span className="font-medium">{f.format.toUpperCase()}</span>
                      <span className="text-xs text-gray-500">
                        {f.tier === 'pro' ? 'Pro' : f.tier === 'preview_free' ? 'Preview' : f.tier}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {publicProduct.freeDownloadUrl ? (
              <a
                href={publicProduct.freeDownloadUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                rel="noopener noreferrer"
              >
                <Download size={18} aria-hidden />
                Free preview download
              </a>
            ) : (
              <p className="text-xs text-gray-500">
                No public preview file is linked for this product. Pro files are available to subscribers
                after purchase.
              </p>
            )}

            {paid ? (
              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-sm font-bold text-gray-900">One-time purchase</h2>
                <p className="mt-1 text-xs text-gray-600">
                  Buy a perpetual license for full-resolution files (checkout via Lemon Squeezy). Map this
                  product slug to a LS variant in{' '}
                  <code className="rounded bg-gray-100 px-1">LEMONSQUEEZY_VARIANT_MAP_JSON</code>.
                </p>
                <div className="mt-3">
                  <LemonSqueezyCheckoutButton kind="one_time" productSlug={product.slug}>
                    Buy this flag
                  </LemonSqueezyCheckoutButton>
                </div>
              </div>
            ) : null}

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-600">
                Need vector masters, high resolution, or a commercial license bundle?
              </p>
              <Link
                href="/pricing"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#009ab6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#007a8a]"
              >
                <Crown size={18} aria-hidden />
                View Pro plans
              </Link>
            </div>

            {product.license?.summary ? (
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">License: </span>
                {product.license.summary}
              </p>
            ) : null}
          </aside>
        </div>

        {relatedPublic.length > 0 ? (
          <section className="mt-16 border-t border-gray-100 pt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-black text-gray-900">
              Related in {categoryName}
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPublic.map(({ product: rp, categoryName: cn }) => (
                <li key={rp.id}>
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
