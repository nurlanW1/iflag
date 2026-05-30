import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { ProductPreviewImage } from '@/components/brand/ProductPreviewImage';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import { collectFormatLabels, formatProductListPrice, isPaidCatalogProduct } from '@/lib/marketplace/catalog-utils';
import { shouldWatermarkFlagPreview } from '@/lib/gallery/flag-preview-watermark';
import { shouldUnoptimizeFlagImageHref } from '@/lib/media/svg-image-url';

function countryLabelFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function MarketplaceProductCard({
  product,
  categoryName,
}: {
  product: PublicProduct;
  categoryName: string;
}) {
  const formats = collectFormatLabels(product.files);
  const href = product.detailHref?.trim() || `/flags/${product.slug}`;
  const formatHints = product.files.map((f) => f.format);
  const thumb = product.thumbnailUrl ?? product.previewUrl;
  const svgThumb = thumb ? shouldUnoptimizeFlagImageHref(thumb, formatHints) : false;
  const isPremium = isPaidCatalogProduct(product);
  const showWatermark = shouldWatermarkFlagPreview({ isPremiumDesign: isPremium });
  const isWebpThumb = Boolean(thumb?.includes('.webp'));
  const fmtSummary = formats.slice(0, 4).join(' · ');
  const countryName = product.countrySlug ? countryLabelFromSlug(product.countrySlug) : null;

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link
        href={href}
        className={`relative block aspect-[4/3] overflow-hidden ${isWebpThumb ? '' : 'bg-[#fafaf9]'}`}
      >
        {thumb ? (
          <ProductPreviewImage
            className="absolute inset-0"
            watermarkEnabled={showWatermark}
            protectEnabled
          >
            <Image
              src={thumb}
              alt={product.title}
              fill
              unoptimized={svgThumb}
              draggable={false}
              className={`relative z-0 transition duration-300 ease-out group-hover:scale-[1.02] ${svgThumb ? 'object-contain p-2' : 'object-contain p-2'}`}
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 380px"
              loading="lazy"
            />
          </ProductPreviewImage>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-400">
            Preview unavailable
          </div>
        )}

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          {isPremium ? (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-600/35 backdrop-blur-[2px]"
              title="Paid stock — subscription or one-time purchase"
            >
              <Crown size={10} className="shrink-0" aria-hidden strokeWidth={2.5} />
              Paid
            </span>
          ) : (
            <span
              className="inline-flex items-center rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-emerald-600/30 backdrop-blur-[2px]"
              title="Free download available"
            >
              Free
            </span>
          )}
        </div>

        {formats.length > 0 ? (
          <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {formats.length} format{formats.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{categoryName}</p>
          {product.countryCode ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {product.countryCode}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-slate-900">
          <Link
            href={href}
            className="rounded hover:text-[var(--brand-blue)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
          >
            {product.title}
          </Link>
        </h3>

        {countryName ? (
          <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {countryName}
            {product.region ? ` · ${product.region.replace(/_/g, ' ')}` : null}
          </p>
        ) : null}

        {fmtSummary ? (
          <p className="line-clamp-2 text-[11px] text-slate-600">{fmtSummary}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span
            className={`text-base font-semibold tabular-nums ${isPremium ? 'text-slate-900' : 'text-emerald-700'}`}
          >
            {formatProductListPrice(product)}
          </span>
          <Link
            href={href}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
