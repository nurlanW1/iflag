import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import {
  collectFormatLabels,
  formatPrice,
  isPaidCatalogProduct,
} from '@/lib/marketplace/catalog-utils';

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
  const paid = isPaidCatalogProduct(product);
  const href = product.detailHref?.trim() || `/flags/${product.slug}`;

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-[0_10px_34px_-26px_rgba(42,52,65,0.14)] transition-[box-shadow,border-color] duration-300 hover:border-neutral-300 hover:shadow-[0_18px_46px_-28px_rgba(42,52,65,0.18)]">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-neutral-100">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-500 ease-out group-hover:opacity-[0.96]"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, (max-width: 1800px) 25vw, 380px"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-base font-medium text-neutral-400">
            Preview unavailable
          </div>
        )}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-lg px-3 py-1.5 text-sm font-medium tracking-wide ${
              paid ? 'bg-[var(--brand-blue)]/92 text-[#fafaf9]' : 'border border-neutral-200/95 bg-white/92 text-neutral-800 backdrop-blur-[2px]'
            }`}
          >
            {paid ? (
              <span className="inline-flex items-center gap-1.5">
                <Crown size={15} className="shrink-0 opacity-95" aria-hidden />
                Pro
              </span>
            ) : (
              'Free'
            )}
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{categoryName}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-[#2a2a2a] sm:text-xl">
          <Link href={href} className="rounded hover:text-[var(--brand-blue)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60">
            {product.title}
          </Link>
        </h3>
        {product.countrySlug ? (
          <p className="mt-1 text-sm font-medium text-neutral-500">{countryLabelFromSlug(product.countrySlug)}</p>
        ) : null}
        {formats.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Available formats">
            {formats.map((fmt) => (
              <li
                key={fmt}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-neutral-700"
              >
                {fmt}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="text-xl font-semibold tabular-nums text-[#2a2a2a]">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <Link
            href={href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white px-7 text-base font-medium text-[#2a2a2a] transition-colors hover:border-neutral-400 hover:bg-neutral-50"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
