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
  const href = product.detailHref?.trim() || `/flags/${product.slug}`;

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md transition-[box-shadow,border-color,transform] hover:-translate-y-0.5 hover:border-[#009ab6]/40 hover:shadow-xl">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, (max-width: 1800px) 25vw, 360px"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
            No image
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm sm:text-sm ${
              paid ? 'bg-[#009ab6]' : 'bg-emerald-600'
            }`}
          >
            {paid ? (
              <span className="inline-flex items-center gap-1">
                <Crown size={13} className="shrink-0" aria-hidden />
                Pro
              </span>
            ) : (
              'Free'
            )}
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-[1.125rem]">
        <p className="text-sm font-bold uppercase tracking-wide text-[#009ab6]/90">
          {categoryName}
        </p>
        <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-snug text-gray-950">
          <Link href={href} className="hover:text-[#009ab6] focus:outline-none focus:ring-2 focus:ring-[#009ab6]/30 rounded">
            {product.title}
          </Link>
        </h3>
        {formats.length > 0 ? (
          <p className="mt-2 text-base leading-relaxed text-gray-600">
            {formats.slice(0, 4).join(' · ')}
            {formats.length > 4 ? '…' : ''}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-lg font-black text-gray-900 sm:text-xl">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <Link
            href={href}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-gray-950 px-6 py-3 text-base font-bold text-white transition hover:bg-[#009ab6]"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
