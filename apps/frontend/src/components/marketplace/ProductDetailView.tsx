import clsx from 'clsx';
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

type Props = {
  slug: string;
  product: Product;
};

/** Minimal stock-style PDP: preview + title + formats + download only (SEO via JsonLd). */
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
          'marketplace-shell bg-white pt-6 sm:pt-8 md:pb-10 md:pt-10 lg:pb-12 lg:pt-11',
          'max-md:pb-[10.5rem]',
        )}
      >
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,17.5rem)] lg:items-start lg:gap-10 xl:gap-14">
          <section aria-label="Preview" className="min-w-0">
            <PremiumAssetPreview
              productTitle={product.title}
              previewUrls={uniquePreview}
              formatHints={formatHints}
            />
          </section>

          <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[1.7rem] sm:leading-snug">
              {product.title}
            </h1>
            <div className="mt-5 lg:mt-6">
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
          </aside>
        </div>
      </main>
    </>
  );
}
