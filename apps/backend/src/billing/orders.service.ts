/**
 * Orders service — one-time purchases (e.g. single premium asset).
 *
 * Subscriptions live in `user_subscriptions`; this table records the discrete
 * fulfilled-once-and-done transactions Lemon Squeezy emits as `order_created`
 * with status=paid.
 */

import pool from '../db.js';

export interface Order {
  id: string;
  user_id: string;
  billing_provider: string;
  provider_order_id: string;
  provider_customer_id: string | null;
  provider_variant_id: string | null;
  product_slug: string | null;
  asset_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'partial_refund' | 'failed' | 'voided';
  refunded_at: Date | null;
  receipt_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertOrderInput {
  user_id: string;
  provider: string;
  provider_order_id: string;
  provider_customer_id?: string | null;
  provider_variant_id?: string | null;
  product_slug?: string | null;
  asset_id?: string | null;
  amount_cents: number;
  currency: string;
  status?: Order['status'];
  receipt_url?: string | null;
  metadata?: Record<string, unknown>;
}

/** Idempotent insert keyed on (provider, provider_order_id). */
export async function upsertOrder(input: UpsertOrderInput): Promise<Order> {
  const result = await pool.query(
    `INSERT INTO orders (
        user_id, billing_provider, provider_order_id, provider_customer_id,
        provider_variant_id, product_slug, asset_id, amount_cents, currency,
        status, receipt_url, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (billing_provider, provider_order_id)
      DO UPDATE SET
        amount_cents = EXCLUDED.amount_cents,
        currency = EXCLUDED.currency,
        status = COALESCE(EXCLUDED.status, orders.status),
        receipt_url = COALESCE(EXCLUDED.receipt_url, orders.receipt_url),
        metadata = orders.metadata || EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
    [
      input.user_id,
      input.provider,
      input.provider_order_id,
      input.provider_customer_id || null,
      input.provider_variant_id || null,
      input.product_slug || null,
      input.asset_id || null,
      input.amount_cents,
      input.currency,
      input.status || 'paid',
      input.receipt_url || null,
      JSON.stringify(input.metadata || {}),
    ]
  );
  return result.rows[0] as Order;
}

export async function markOrderRefunded(
  provider: string,
  providerOrderId: string,
  fullRefund: boolean = true
): Promise<Order | null> {
  const result = await pool.query(
    `UPDATE orders
        SET status = $1::text,
            refunded_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
      WHERE billing_provider = $2 AND provider_order_id = $3
      RETURNING *`,
    [fullRefund ? 'refunded' : 'partial_refund', provider, providerOrderId]
  );
  return result.rows[0] || null;
}

export async function getOrderByProviderId(
  provider: string,
  providerOrderId: string
): Promise<Order | null> {
  const result = await pool.query(
    `SELECT * FROM orders
      WHERE billing_provider = $1 AND provider_order_id = $2
      LIMIT 1`,
    [provider, providerOrderId]
  );
  return result.rows[0] || null;
}

export async function getUserOrders(
  userId: string,
  opts: { page?: number; limit?: number } = {}
): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1',
    [userId]
  );
  const total = countResult.rows[0].total;

  const result = await pool.query(
    `SELECT * FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { orders: result.rows as Order[], total, page, limit };
}
