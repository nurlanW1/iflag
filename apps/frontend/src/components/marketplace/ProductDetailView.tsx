import clsx from 'clsx';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductDetailPreviewColumn } from '@/components/marketplace/asset-detail/ProductDetailPreviewColumn';
import { productVideoPlayback } from '@/lib/marketplace/product-video-playback';
import type { AssetSeoPayload } from '@/lib/seo/asset-metadata';
import { marketplaceProductCanonicalPath } from '@/lib/seo/marketplace-product-metadata';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structured-data';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import { shouldWatermarkFlagPreview } from '@/lib/gallery/flag-preview-watermark';
import { dedupePublicProductFiles, isPaidCatalogProduct } from '@/lib/marketplace/catalog-utils';
import { productShareImageUrl } from '@/lib/seo/product-share-image';
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

function formatHintsMayHaveAlpha(hints: string[]): boolean {
  return hints.some((h) => {
    const k = h.replace(/^\./, '').toLowerCase();
    return ['png', 'webp', 'svg', 'gif'].includes(k);
  });
}

/** PDP — gallery-aligned preview + sticky download panel. */
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
    assetGroupKey: product.assetGroupKey ?? null,
    countrySlug: product.countrySlug ?? null,
  };

  const canonicalPath =
    product.seo.canonicalPath?.trim() || marketplaceProductCanonicalPath(product.slug);

  const seoPayload: AssetSeoPayload = {
    title: product.seo.metaTitle || product.title,
    description: product.seo.metaDescription || product.description,
    image: productShareImageUrl(product) || product.previewUrl || product.thumbnailUrl,
    canonicalPath,
    priceCents: product.priceCents,
    currency: product.currency,
  };

  const formatHints = dedupedFiles.map((f) => f.format);
  const videoPlayback = productVideoPlayback(product);

  const siblingProducts = listCountryVariants(product);
  const siblingPublic = siblingProducts.map(toPublicProduct);
  const variantGalleryHref = product.countrySlug?.trim()
    ? `/gallery/${encodeURIComponent(product.countrySlug.trim().toLowerCase())}`
    : null;

  const licenseSummary = product.license?.summary?.trim() || null;

  const tagTrail =
    product.tags.length > 0 ? (
      <section className="mt-10 border-t border-slate-200/80 pt-7 md:mt-12" aria-label="Tags">
        <p className="text-[12px] leading-relaxed text-slate-500">
          {product.tags.map((t, i) => (
            <span key={t} className="inline whitespace-nowrap">
              {i > 0 ? <span className="text-slate-300"> · </span> : null}
              <Link
                href={`/gallery?q=${encodeURIComponent(t)}`}
                className="font-medium text-slate-600 underline-offset-2 transition-colors hover:text-[var(--brand-blue)] hover:underline"
              >
                {t}
              </Link>
            </span>
          ))}
        </p>
      </section>
    ) : null;

  const browseBackHref = neonDownloads ? '/assets' : '/gallery';

  const countrySlug = product.countrySlug?.trim().toLowerCase() ?? null;
  const countryDisplayName = countrySlug
    ? countrySlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : null;

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(slug, seoPayload, publicProduct),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: neonDownloads ? 'Assets' : 'Gallery', path: browseBackHref },
            { name: product.title, path: canonicalPath },
          ]),
        ]}
      />
      <main
        className={clsx(
          'marketplace-shell min-h-screen bg-slate-50',
          'max-lg:pb-[calc(2.5rem+env(safe-area-inset-bottom,0px)+var(--cookie-banner-h,0px))] lg:pb-[4.75rem]',
        )}
      >
        <div className="mx-auto max-w-[min(100%,1392px)] px-4 pb-10 pt-4 sm:px-5 sm:pb-12 sm:pt-5 lg:pb-10 lg:pt-5 xl:px-8">
          <nav aria-label="Breadcrumb" className="text-[11px] font-medium text-slate-500">
            {/* Mobile: just ← Back */}
            <Link
              href={browseBackHref}
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-900 sm:hidden"
            >
              <ArrowLeft size={14} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
              Back
            </Link>
            {/* Desktop: full 3-level breadcrumb */}
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href={browseBackHref}
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-900"
              >
                <ArrowLeft size={14} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
                {neonDownloads ? 'Assets' : 'Gallery'}
              </Link>
              {countrySlug && countryDisplayName ? (
                <>
                  <span className="text-slate-300">/</span>
                  <Link
                    href={`/gallery/${encodeURIComponent(countrySlug)}`}
                    className="truncate transition-colors hover:text-slate-900"
                  >
                    {countryDisplayName}
                  </Link>
                </>
              ) : null}
              <span className="text-slate-300">/</span>
              <span className="truncate font-semibold text-slate-700">{product.title}</span>
            </div>
          </nav>

          <header className="mt-3 border-b border-slate-200/80 pb-3 lg:mt-4 lg:pb-4">
            <h1 className="text-balance text-[1.35rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-2xl lg:max-w-[min(100%,42rem)] xl:text-[1.65rem]">
              {product.title}
            </h1>
          </header>

          <div className="mt-4 space-y-4 lg:space-y-5">
            <ProductDetailPreviewColumn
              productTitle={product.title}
              publicProduct={publicProduct}
              catalogFiles={product.files}
              dedupedFiles={dedupedFiles}
              formatHints={formatHints}
              useTransparencyBackdrop={formatHintsMayHaveAlpha(formatHints)}
              watermarkEnabled={shouldWatermarkFlagPreview({ isPremiumDesign: paid })}
              paid={paid}
              cartProduct={cartProduct}
              licenseSummary={licenseSummary}
              neonDownloads={neonDownloads}
              productId={neonDownloads ? undefined : product.id}
              previewFilePublic={neonDownloads ? null : previewFilePublic}
              videoPlayback={videoPlayback}
            />

            {siblingPublic.length > 0 ? (
              <CountryDesignVariantRibbon
                variants={siblingPublic}
                galleryHref={variantGalleryHref}
                countryName={countryDisplayName ?? undefined}
              />
            ) : null}

            {tagTrail}
          </div>
        </div>
      </main>
    </>
  );
}
