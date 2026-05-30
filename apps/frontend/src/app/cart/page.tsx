'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const { lines, totalItems, ready, removeProduct, clear } = useCart();

  return (
    <main className="mx-auto max-w-[min(100%,896px)] px-5 pb-24 pt-10 sm:px-6 lg:pb-28 lg:pt-12">
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-slate-900">Shopping cart</h1>
      <p className="mt-2 text-[14px] text-slate-500">
        Saved on this browser for your signed-in session. Each account or guest bucket keeps its own cart.
      </p>

      {!ready ? (
        <p className="mt-10 text-sm text-slate-500">Loading cart…</p>
      ) : lines.length === 0 ? (
        <div className="mt-14 rounded-[1.125rem] border border-slate-200/95 bg-white/90 p-8 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-[15px] font-medium text-slate-700">Your cart is empty.</p>
          <Link
            href="/gallery"
            className="mt-6 inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-[var(--brand-blue)] px-6 text-[15px] font-semibold text-white shadow-md transition hover:bg-[var(--brand-blue-hover)]"
          >
            Open gallery
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {lines.length} {lines.length === 1 ? 'item' : 'items'} · {totalItems}{' '}
              {totalItems === 1 ? 'copy' : 'copies'} total
            </p>
            <button
              type="button"
              onClick={() => clear()}
              className="text-[13px] font-semibold text-[var(--brand-blue)] underline-offset-2 hover:underline"
            >
              Clear cart
            </button>
          </div>
          <ul className="space-y-3" aria-label="Cart lines">
            {lines.map((l) => (
              <li key={l.productId}>
                <article className="flex flex-wrap items-start justify-between gap-4 rounded-[1rem] border border-slate-200/90 bg-white/95 px-5 py-4 shadow-sm ring-1 ring-slate-100">
                  <div className="min-w-0">
                    <Link
                      href={l.pathname}
                      className="text-[17px] font-semibold tracking-tight text-slate-900 underline-offset-[0.22em] transition hover:text-[var(--brand-blue)] hover:underline"
                    >
                      {l.title || l.slug}
                    </Link>
                    <p className="mt-1 text-[13px] text-slate-500">
                      qty <span className="tabular-nums">{l.quantity}</span>
                      {l.slug ? (
                        <>
                          {' '}
                          · <span className="font-medium text-slate-600">{l.slug}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/95 bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-50"
                    aria-label={`Remove ${l.title} from cart`}
                    onClick={() => removeProduct(l.productId)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </button>
                </article>
              </li>
            ))}
          </ul>
          <p className="pt-6 text-[13px] leading-relaxed text-slate-500">
            Checkout flows can be wired to Paddle or invoicing separately; this cart is persisted locally until you integrate a server cart.
          </p>
          <Link
            href="/gallery"
            className="mt-6 inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-slate-200/95 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Continue shopping
          </Link>
        </div>
      )}
    </main>
  );
}
