'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import {
  ONE_TIME_STOCK,
  PRICING_CHECKOUT_DISCLAIMER,
  formatPricingMoney,
} from '@/lib/marketing/pricing-config';

function CartLoadingSkeleton() {
  return (
    <div className="mt-8 space-y-3" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-[5.5rem] animate-pulse rounded-2xl border border-slate-200/80 bg-white/80"
        />
      ))}
    </div>
  );
}

export default function CartPage() {
  const { lines, totalItems, lineCount, ready, removeProduct, clear } = useCart();
  const unitLabel = formatPricingMoney(ONE_TIME_STOCK.displayCents);

  return (
    <main className="marketplace-shell min-h-screen bg-slate-50 pb-20 pt-6 sm:pb-24 sm:pt-8 lg:pt-10">
      <div className="mx-auto w-full max-w-6xl">
        <nav className="mb-6">
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Back to gallery
          </Link>
        </nav>

        <header className="border-b border-slate-200/80 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[1.65rem] font-semibold tracking-tight text-slate-900 sm:text-[1.85rem]">
                Your cart
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate-500">
                Designs you saved for later. Checkout happens on each product page — one-time
                purchase unlocks all formats for that design.
              </p>
            </div>
            {ready && lineCount > 0 ? (
              <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 shadow-sm">
                <ShoppingCart className="h-4 w-4 text-[var(--brand-blue)]" aria-hidden />
                <span className="text-[13px] font-semibold tabular-nums text-slate-800">
                  {lineCount} {lineCount === 1 ? 'design' : 'designs'}
                </span>
              </div>
            ) : null}
          </div>
        </header>

        {!ready ? (
          <CartLoadingSkeleton />
        ) : lines.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200/90 bg-white p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ShoppingBag className="h-8 w-8" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mt-6 text-lg font-semibold text-slate-900">Your cart is empty</p>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-slate-500">
              Browse country folders and add flag designs you want to buy later.
            </p>
            <Link
              href="/gallery"
              className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-7 text-[15px] font-semibold text-white shadow-md transition hover:bg-[var(--brand-blue-hover)]"
            >
              Explore gallery
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(17rem,20rem)] lg:items-start lg:gap-8 xl:gap-10">
            <section aria-label="Cart items">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {lineCount} {lineCount === 1 ? 'item' : 'items'} · {totalItems}{' '}
                  {totalItems === 1 ? 'copy' : 'copies'}
                </p>
                <button
                  type="button"
                  onClick={() => clear()}
                  className="text-[13px] font-semibold text-slate-500 underline-offset-2 transition hover:text-red-600 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <ul className="space-y-3">
                {lines.map((l, index) => (
                  <li key={l.productId}>
                    <article className="group flex gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300/90 hover:shadow-md sm:p-5">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-[var(--brand-blue)] ring-1 ring-slate-200/80 sm:h-16 sm:w-16"
                        aria-hidden
                      >
                        <span className="text-lg font-bold tabular-nums text-slate-400">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={l.pathname}
                            className="line-clamp-2 text-[16px] font-semibold leading-snug text-slate-900 underline-offset-4 transition hover:text-[var(--brand-blue)] hover:underline sm:text-[17px]"
                          >
                            {l.title || l.slug}
                          </Link>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-medium tabular-nums text-slate-700">
                              Qty {l.quantity}
                            </span>
                            {l.slug ? (
                              <span className="truncate font-mono text-[11px] text-slate-400">
                                {l.slug}
                              </span>
                            ) : null}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Link
                            href={l.pathname}
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                          >
                            View &amp; buy
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Remove ${l.title} from cart`}
                            onClick={() => removeProduct(l.productId)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            <span className="sr-only sm:not-sr-only sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="mt-8 lg:sticky lg:top-24 lg:mt-0">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Summary
                </h2>
                <dl className="mt-4 space-y-3 border-b border-slate-100 pb-5">
                  <div className="flex items-center justify-between gap-4 text-[14px]">
                    <dt className="text-slate-600">Designs saved</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{lineCount}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[14px]">
                    <dt className="text-slate-600">Total copies</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{totalItems}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[14px]">
                    <dt className="text-slate-600">Price per design</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{unitLabel}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
                  Open a design and use <span className="font-medium text-slate-700">Buy</span> on
                  the product page. Official flat flags may be free — premium variants are{' '}
                  {unitLabel} each via Paddle.
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  {PRICING_CHECKOUT_DISCLAIMER}
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  {lines[0] ? (
                    <Link
                      href={lines[0].pathname}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-blue)] px-5 text-[14px] font-semibold text-white shadow-md transition hover:bg-[var(--brand-blue-hover)]"
                    >
                      Continue with first item
                    </Link>
                  ) : null}
                  <Link
                    href="/gallery"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
