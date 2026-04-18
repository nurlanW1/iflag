import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';
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
  const href = `/browse/${product.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition hover:border-[#009ab6]/35 hover:shadow-md">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
              paid                ? 'bg-[#009ab6] text-white'
                : 'bg-emerald-600 text-white'
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
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#009ab6]/90">
          {categoryName}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-bold text-gray-900">
          <Link href={href} className="hover:text-[#009ab6] focus:outline-none focus:ring-2 focus:ring-[#009ab6]/30 rounded">
            {product.title}
          </Link>
        </h3>
        {formats.length > 0 ? (
          <p className="mt-2 text-xs text-gray-500">
            {formats.slice(0, 4).join(' · ')}
            {formats.length > 4 ? '…' : ''}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-lg font-black text-gray-900">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <Link
            href={href}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#009ab6]"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
