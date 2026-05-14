/**
 * Backend billing / subscription checks (Paddle + Postgres), via JWT cookie.
 */

import { resolveBackendApiBase } from '@/lib/auth/backend-url';

type OrdersPage = {
  orders?: Array<{
    product_slug?: string | null;
    status?: string;
    created_at?: string;
  }>;
  total?: number;
};

/** `null` — HTTP or network failure (caller may fall back). */
export async function fetchBackendHasPremium(accessToken: string): Promise<boolean | null> {
  try {
    const api = resolveBackendApiBase();
    if (!api.ok) return null;
    const res = await fetch(`${api.baseUrl}/subscriptions/check-premium`, {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { hasPremium?: boolean };
    return Boolean(data.hasPremium);
  } catch {
    return null;
  }
}

/**
 * Latest paid / partial-refund order timestamp per marketplace `product_slug`.
 * `null` — request failure.
 */
export async function fetchBackendPaidProductGrantDates(
  accessToken: string
): Promise<Map<string, string> | null> {
  try {
    const api = resolveBackendApiBase();
    if (!api.ok) return null;
    const bySlug = new Map<string, string>();
    let page = 1;
    const limit = 100;
    let total = Number.POSITIVE_INFINITY;

    while ((page - 1) * limit < total) {
      const res = await fetch(
        `${api.baseUrl}/billing/orders?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken.trim()}` },
          cache: 'no-store',
        }
      );
      if (!res.ok) return null;

      const data = (await res.json()) as OrdersPage;
      total = typeof data.total === 'number' ? data.total : 0;
      const orders = data.orders ?? [];

      for (const o of orders) {
        const st = o.status;
        if (st !== 'paid' && st !== 'partial_refund') continue;
        const slug = o.product_slug?.trim();
        if (!slug) continue;
        const ts = o.created_at ?? '';
        const prev = bySlug.get(slug);
        if (!prev || ts > prev) bySlug.set(slug, ts || prev || new Date().toISOString());
      }

      if (orders.length === 0) break;
      page += 1;
    }

    return bySlug;
  } catch {
    return null;
  }
}

export type BillingOrderRow = {
  id: string;
  product_slug: string | null;
  status: string;
  created_at: string;
};

/** All pages of `/billing/orders` for the authenticated user. */
export async function fetchAllBillingOrders(accessToken: string): Promise<BillingOrderRow[] | null> {
  try {
    const api = resolveBackendApiBase();
    if (!api.ok) return null;
    const out: BillingOrderRow[] = [];
    let page = 1;
    const limit = 100;
    let total = Number.POSITIVE_INFINITY;

    while ((page - 1) * limit < total) {
      const res = await fetch(
        `${api.baseUrl}/billing/orders?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken.trim()}` },
          cache: 'no-store',
        }
      );
      if (!res.ok) return null;

      const data = (await res.json()) as {
        orders?: BillingOrderRow[];
        total?: number;
      };
      total = typeof data.total === 'number' ? data.total : 0;
      const orders = data.orders ?? [];
      for (const o of orders) {
        out.push({
          id: String(o.id),
          product_slug: o.product_slug ?? null,
          status: String(o.status ?? ''),
          created_at: typeof o.created_at === 'string' ? o.created_at : String(o.created_at ?? ''),
        });
      }
      if (orders.length === 0) break;
      page += 1;
    }

    return out;
  } catch {
    return null;
  }
}
