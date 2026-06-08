'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ShoppingBag } from 'lucide-react';

interface Order {
  id: string;
  product_slug: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function DownloadsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-stone-300" />
        <p className="mt-4 font-semibold text-stone-600">No purchases yet</p>
        <p className="mt-1 text-sm text-stone-400">
          Buy a premium design — it appears here after Paddle confirms payment.
        </p>
        <Link
          href="/gallery"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-blue-hover)]"
        >
          Browse gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
            <Download size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900">{order.product_slug}</p>
            <p className="text-xs text-stone-400">
              {new Date(order.created_at).toLocaleDateString()} · ${(order.amount_cents / 100).toFixed(2)}
            </p>
          </div>
          <Link
            href={`/assets/${order.product_slug}`}
            className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Download
          </Link>
        </div>
      ))}
    </div>
  );
}
