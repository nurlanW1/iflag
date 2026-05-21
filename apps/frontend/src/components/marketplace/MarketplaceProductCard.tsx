import Image from 'next/image';
import Link from 'next/link';
import { Crown, Download } from 'lucide-react';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import {
  collectFormatLabels,
  formatPrice,
  isPaidCatalogProduct,
} from '@/lib/marketplace/catalog-utils';

export function MarketplaceProductCard({
  product,
  categoryName,
}: {
  product: PublicProduct;
  categoryName: string;
}) {
  const formats = collectFormatLabels(product.files);
  const paid = isPaidCatalogProduct(product);
  const href = product.detailHref?.trim() || `/flags/${product.slug}`;

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:border-[#009ab6]/35 hover:shadow-[0_20px_44px_-14px_rgba(0,154,182,0.22)]">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-neutral-100">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, (max-width: 1800px) 25vw, 380px"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-base font-medium text-neutral-400">
            Preview unavailable
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-white shadow-md ${
              paid ? 'bg-[#009ab6]' : 'bg-emerald-600'
            }`}
          >
            {paid ? (
              <span className="inline-flex items-center gap-1.5">
                <Crown size={16} className="shrink-0" aria-hidden />
                Pro
              </span>
            ) : (
              'Free'
            )}
          </span>
          <span className="rounded-lg border border-white/35 bg-black/45 px-3 py-1.5 text-sm font-semibold text-white/95 backdrop-blur-sm">
            <Download size={14} className="mr-1 inline-block opacity-90" aria-hidden />
            Asset
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#009ab6]/90">{categoryName}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-neutral-950 sm:text-xl">
          <Link href={href} className="rounded hover:text-[#009ab6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009ab6]/35">
            {product.title}
          </Link>
        </h3>
        {formats.length > 0 ? (
          <p className="mt-3 text-base leading-relaxed text-neutral-600">
            {formats.slice(0, 4).join(' · ')}
            {formats.length > 4 ? '…' : ''}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="text-xl font-bold tabular-nums text-neutral-900">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <Link
            href={href}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-8 text-base font-semibold text-white transition hover:bg-[#009ab6]"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
