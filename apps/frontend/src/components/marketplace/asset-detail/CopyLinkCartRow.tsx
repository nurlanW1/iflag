'use client';

import { usePathname } from 'next/navigation';
import { Link2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

export type CartProductRef = {
  productId: string;
  slug: string;
  title: string;
  pathname: string;
  assetGroupKey?: string | null;
  countrySlug?: string | null;
};

type Props = {
  product: CartProductRef;
};

/**
 * PDP quick actions — copy URL + add this product to the user’s (or guest) cart.
 */
export function CopyLinkCartRow({ product }: Props) {
  const pathname = usePathname();
  const { addProduct, ready } = useCart();

  const fullUrl =
    typeof window !== 'undefined' && pathname ? `${window.location.origin}${pathname}` : '';

  const onCopy = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const onCart = () => {
    if (!ready) {
      toast.message('Cart is still loading — try again in a moment');
      return;
    }
    addProduct({
      productId: product.productId,
      slug: product.slug,
      title: product.title,
      pathname: product.pathname,
    });
    toast.success('Added to cart');
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => void onCopy()}
        className="inline-flex min-h-[2.875rem] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/95 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-700 transition-[transform,background] duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
      >
        <Link2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        Copy link
      </button>
      <button
        type="button"
        disabled={!ready}
        onClick={onCart}
        className="inline-flex min-h-[2.875rem] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/95 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-700 transition-[transform,background] duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        aria-busy={!ready}
      >
        <ShoppingCart className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        Add to cart
      </button>
    </div>
  );
}
