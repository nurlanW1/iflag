import clsx from 'clsx';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { PremiumAssetPreview } from '@/components/marketplace/asset-detail/PremiumAssetPreview';
import type { AssetSeoPayload } from '@/lib/seo/asset-metadata';
import { marketplaceProductCanonicalPath } from '@/lib/seo/marketplace-product-metadata';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structured-data';
import { toPublicProduct } from '@/lib/marketplace/product-mapper';
import { dedupePublicProductFiles, isPaidCatalogProduct } from '@/lib/marketplace/catalog-utils';
import { NeonAssetDownloads } from '@/components/marketplace/NeonAssetDownloads';
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
      <section className="mt-10 border-t border-slate-200/80 pt-7 md:mt-12" aria-label="Tags">
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

  const browseBackHref = neonDownloads ? '/assets' : '/browse';

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(slug, seoPayload, publicProduct),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: neonDownloads ? 'Assets' : 'Browse', path: browseBackHref },
            { name: product.title, path: canonicalPath },
          ]),
        ]}
      />
      <main
        className={clsx(
          'marketplace-shell min-h-screen bg-slate-50',
          'max-lg:pb-[calc(21rem+env(safe-area-inset-bottom,0px)+var(--cookie-banner-h,0px))] lg:pb-[4.75rem]',
        )}
      >
        <div className="mx-auto max-w-[min(100%,1392px)] px-5 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 xl:px-10 lg:pb-[4.75rem] lg:pt-11">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link
              href={browseBackHref}
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-900"
            >
              <ArrowLeft
                size={14}
                strokeWidth={2}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              {neonDownloads ? 'Assets' : 'Browse'}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="truncate text-slate-700">{product.title}</span>
          </nav>

          <header className="mt-6 flex flex-wrap items-end justify-between gap-5 border-b border-slate-200/80 pb-6 lg:mt-8 lg:pb-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Sparkles size={12} className="text-[var(--brand-blue)]" aria-hidden />
                {categoryName}
                {countryLine ? (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-slate-600">
                    {countryLine}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-balance text-[1.75rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-[1.95rem] xl:text-[2rem] xl:tracking-tight">
                {product.title}
              </h1>
              <p className="mt-2 text-[13px] text-slate-500">
                <span className="font-semibold text-slate-700">{dedupedFiles.length}</span>{' '}
                {dedupedFiles.length === 1 ? 'format' : 'formats'} available
                {siblingProducts.length > 0 ? (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-semibold text-slate-700">{siblingProducts.length + 1}</span> designs in
                    this country
                  </>
                ) : null}
              </p>
            </div>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18.75rem,24rem)] lg:items-stretch lg:gap-5 xl:grid-cols-[minmax(0,1fr)_25rem] xl:gap-6">
            <div className="flex min-h-0 min-w-0 flex-col space-y-6">
              <PremiumAssetPreview
                productTitle={product.title}
                previewUrls={uniquePreview}
                formatHints={formatHints}
                useTransparencyBackdrop={formatHintsMayHaveAlpha(formatHints)}
                variant="gallery"
                caption={product.title}
                formatCount={dedupedFiles.length}
              />

              {siblingPublic.length > 0 ? (
                <CountryDesignVariantRibbon variants={siblingPublic} galleryHref={variantGalleryHref} />
              ) : null}

              {tagTrail}
            </div>

            <aside className="w-full shrink-0 lg:sticky lg:top-[calc(5rem+env(safe-area-inset-top))] lg:z-[20] lg:h-auto lg:self-stretch">
              <div className="flex min-h-[26rem] h-full flex-col overflow-hidden rounded-[1.375rem] border border-slate-200/80 bg-white p-[1.6rem] backdrop-blur-[14px]">
                <NeonAssetDownloads
                  cartProduct={cartProduct}
                  files={dedupedFiles}
                  licenseSummary={licenseSummary}
                  assetLabel={product.title}
                  productSlug={product.slug}
                  productId={neonDownloads ? undefined : product.id}
                  previewFile={neonDownloads ? undefined : previewFilePublic}
                  requiresEntitlement={neonDownloads ? undefined : paid}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
