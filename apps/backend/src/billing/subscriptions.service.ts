/**
 * Provider-aware subscription management.
 *
 * This complements `src/subscriptions/subscription.service.ts` (read-only,
 * legacy) by providing write operations driven by webhooks and routes.
 */

import pool from '../db.js';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'expired'
  | 'past_due'
  | 'trialing'
  | 'paused'
  | 'unpaid';

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  billing_provider: string;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  provider_variant_id: string | null;
  provider_order_id: string | null;
  provider_status: string | null;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  ends_at: Date | null;
  trial_ends_at: Date | null;
  pause_starts_at: Date | null;
  pause_resumes_at: Date | null;
  update_payment_method_url: string | null;
  customer_portal_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertSubscriptionInput {
  user_id: string;
  plan_slug: string;
  provider: string;
  provider_subscription_id: string;
  provider_customer_id?: string | null;
  provider_variant_id?: string | null;
  provider_order_id?: string | null;
  provider_status?: string | null;
  status: SubscriptionStatus;
  current_period_start: Date | string;
  current_period_end: Date | string;
  cancel_at_period_end: boolean;
  ends_at?: Date | string | null;
  trial_ends_at?: Date | string | null;
  pause_starts_at?: Date | string | null;
  pause_resumes_at?: Date | string | null;
  update_payment_method_url?: string | null;
  customer_portal_url?: string | null;
}

async function resolvePlanIdBySlug(slug: string): Promise<string | null> {
  const res = await pool.query(
    'SELECT id FROM subscription_plans WHERE slug = $1 LIMIT 1',
    [slug]
  );
  return res.rows[0]?.id ?? null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

/**
 * Upsert by (billing_provider, provider_subscription_id). Creates a row on
 * first webhook (`subscription_created`) and updates on every subsequent event.
 */
export async function upsertSubscription(
  input: UpsertSubscriptionInput
): Promise<SubscriptionRow> {
  const planId = await resolvePlanIdBySlug(input.plan_slug);
  if (!planId) {
    throw new Error(
      `subscription_plans row for slug "${input.plan_slug}" not found. ` +
        `Seed the plan (and set provider_variant_id) before processing this webhook.`
    );
  }

  const result = await pool.query(
    `INSERT INTO user_subscriptions (
        user_id, plan_id, billing_provider,
        provider_subscription_id, provider_customer_id,
        provider_variant_id, provider_order_id, provider_status,
        status, current_period_start, current_period_end,
        cancel_at_period_end, ends_at, trial_ends_at,
        pause_starts_at, pause_resumes_at,
        update_payment_method_url, customer_portal_url
      )
      VALUES (
        $1, $2, $3,
        $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16,
        $17, $18
      )
      ON CONFLICT (billing_provider, provider_subscription_id)
      WHERE provider_subscription_id IS NOT NULL
      DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        provider_customer_id = COALESCE(EXCLUDED.provider_customer_id, user_subscriptions.provider_customer_id),
        provider_variant_id = COALESCE(EXCLUDED.provider_variant_id, user_subscriptions.provider_variant_id),
        provider_order_id = COALESCE(EXCLUDED.provider_order_id, user_subscriptions.provider_order_id),
        provider_status = EXCLUDED.provider_status,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        ends_at = EXCLUDED.ends_at,
        trial_ends_at = EXCLUDED.trial_ends_at,
        pause_starts_at = EXCLUDED.pause_starts_at,
        pause_resumes_at = EXCLUDED.pause_resumes_at,
        update_payment_method_url = COALESCE(EXCLUDED.update_payment_method_url, user_subscriptions.update_payment_method_url),
        customer_portal_url = COALESCE(EXCLUDED.customer_portal_url, user_subscriptions.customer_portal_url),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
    [
      input.user_id,
      planId,
      input.provider,
      input.provider_subscription_id,
      input.provider_customer_id || null,
      input.provider_variant_id || null,
      input.provider_order_id || null,
      input.provider_status || null,
      input.status,
      toDate(input.current_period_start),
      toDate(input.current_period_end),
      input.cancel_at_period_end,
      toDate(input.ends_at) ?? null,
      toDate(input.trial_ends_at) ?? null,
      toDate(input.pause_starts_at) ?? null,
      toDate(input.pause_resumes_at) ?? null,
      input.update_payment_method_url || null,
      input.customer_portal_url || null,
    ]
  );

  return result.rows[0] as SubscriptionRow;
}

export async function getUserActiveSubscription(
  userId: string
): Promise<SubscriptionRow | null> {
  const res = await pool.query(
    `SELECT * FROM user_subscriptions
      WHERE user_id = $1
        AND status IN ('active', 'trialing')
        AND current_period_end > CURRENT_TIMESTAMP
      ORDER BY current_period_end DESC
      LIMIT 1`,
    [userId]
  );
  return res.rows[0] || null;
}

export async function getSubscriptionByProviderId(
  provider: string,
  providerSubscriptionId: string
): Promise<SubscriptionRow | null> {
  const res = await pool.query(
    `SELECT * FROM user_subscriptions
      WHERE billing_provider = $1 AND provider_subscription_id = $2
      LIMIT 1`,
    [provider, providerSubscriptionId]
  );
  return res.rows[0] || null;
}

export async function userIdFromProviderSubscription(
  provider: string,
  providerSubscriptionId: string
): Promise<string | null> {
  const sub = await getSubscriptionByProviderId(provider, providerSubscriptionId);
  return sub?.user_id ?? null;
}

/** True if the user currently has an active or trialing subscription. */
export async function hasActivePremium(userId: string): Promise<boolean> {
  return (await getUserActiveSubscription(userId)) !== null;
}
