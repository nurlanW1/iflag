import clsx from 'clsx';
import Link from 'next/link';
import { ArrowLeft, Crown } from 'lucide-react';
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
import { GalleryVariantsRow } from '@/components/marketplace/GalleryVariantsRow';
import { ShutterstockSection } from '@/components/flags/ShutterstockSection';
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
      <section className="mt-8 border-t border-slate-200/80 pt-6" aria-label="Tags">
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
          'marketplace-shell min-h-screen bg-[#fafaf9]',
          'max-lg:pb-[calc(2.5rem+env(safe-area-inset-bottom,0px)+var(--cookie-banner-h,0px))]',
          'pb-12 pt-5 lg:pb-16 lg:pt-6',
        )}
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-[11px] font-medium text-slate-500">
          <Link
            href={browseBackHref}
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-900 sm:hidden"
          >
            <ArrowLeft size={13} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
            Back
          </Link>
          <div className="hidden items-center gap-1.5 sm:flex">
            <Link href={browseBackHref} className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-900">
              <ArrowLeft size={13} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
              {neonDownloads ? 'Assets' : 'Gallery'}
            </Link>
            {countrySlug && countryDisplayName ? (
              <>
                <span className="text-slate-300">/</span>
                <Link href={`/gallery/${encodeURIComponent(countrySlug)}`} className="transition-colors hover:text-slate-900">
                  {countryDisplayName}
                </Link>
              </>
            ) : null}
            <span className="text-slate-300">/</span>
            <span className="truncate font-semibold text-slate-700">{product.title}</span>
          </div>
        </nav>

        {/* Title + meta */}
        <header className="mb-5 border-b border-slate-200/70 pb-5">
          {/* Tier + country meta row */}
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            {paid ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-600/35">
                <Crown size={11} className="shrink-0" aria-hidden strokeWidth={2.5} />
                Paid design
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-emerald-600/30">
                Free download
              </span>
            )}
            {countryDisplayName && countrySlug ? (
              <Link
                href={`/gallery/${encodeURIComponent(countrySlug)}`}
                className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                {countryDisplayName}
              </Link>
            ) : null}
            {formatHints.length > 0 ? (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {formatHints.length} format{formatHints.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          <h1 className="text-balance text-xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-2xl lg:text-[1.625rem]">
            {product.title}
          </h1>
          {product.description?.trim() ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {product.description.trim()}
            </p>
          ) : null}
        </header>

        {/* Main content */}
        <div className="space-y-5">
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

          {siblingPublic.length > 0 && (
            <CountryDesignVariantRibbon
              variants={siblingPublic}
              galleryHref={variantGalleryHref}
              countryName={countryDisplayName ?? undefined}
            />
          )}

          {countrySlug && variantGalleryHref && (
            <GalleryVariantsRow
              countrySlug={countrySlug}
              currentProductSlug={product.slug}
              countryName={countryDisplayName ?? countrySlug}
              galleryHref={variantGalleryHref}
            />
            )}

          {tagTrail}

          {countryDisplayName && (
            <ShutterstockSection countryName={countryDisplayName} />
          )}
        </div>
      </main>
    </>
  );
}
