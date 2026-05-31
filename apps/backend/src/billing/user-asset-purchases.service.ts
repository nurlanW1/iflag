/**
 * Permanent per-asset ownership after Paddle one-time checkout.
 */

import pool from '../db.js';

export type UserAssetPurchase = {
  id: string;
  user_id: string;
  asset_group_key: string;
  product_slug: string | null;
  asset_id: string | null;
  paddle_transaction_id: string;
  purchase_type: 'one_time';
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  purchased_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type UpsertUserAssetPurchaseInput = {
  user_id: string;
  asset_group_key: string;
  product_slug?: string | null;
  asset_id?: string | null;
  paddle_transaction_id: string;
  purchase_type?: 'one_time';
  status?: UserAssetPurchase['status'];
  purchased_at?: Date;
};

export async function upsertUserAssetPurchase(
  input: UpsertUserAssetPurchaseInput
): Promise<UserAssetPurchase> {
  const result = await pool.query(
    `INSERT INTO user_asset_purchases (
        user_id, asset_group_key, product_slug, asset_id,
        paddle_transaction_id, purchase_type, status, purchased_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8, CURRENT_TIMESTAMP))
      ON CONFLICT (user_id, asset_group_key)
      DO UPDATE SET
        product_slug = COALESCE(EXCLUDED.product_slug, user_asset_purchases.product_slug),
        asset_id = COALESCE(EXCLUDED.asset_id, user_asset_purchases.asset_id),
        paddle_transaction_id = EXCLUDED.paddle_transaction_id,
        status = EXCLUDED.status,
        purchased_at = CASE
          WHEN user_asset_purchases.status <> 'paid' AND EXCLUDED.status = 'paid'
            THEN COALESCE(EXCLUDED.purchased_at, CURRENT_TIMESTAMP)
          ELSE user_asset_purchases.purchased_at
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
    [
      input.user_id,
      input.asset_group_key.trim().toLowerCase(),
      input.product_slug?.trim() || null,
      input.asset_id || null,
      input.paddle_transaction_id.trim(),
      input.purchase_type || 'one_time',
      input.status || 'paid',
      input.purchased_at ?? null,
    ]
  );
  return result.rows[0] as UserAssetPurchase;
}

export async function userOwnsAssetGroup(
  userId: string,
  assetGroupKey: string,
  productSlug?: string | null
): Promise<boolean> {
  const ag = assetGroupKey.trim().toLowerCase();
  const slug = productSlug?.trim().toLowerCase() || null;

  const r = await pool.query(
    `SELECT 1
       FROM user_asset_purchases
      WHERE user_id = $1
        AND status = 'paid'
        AND (
          asset_group_key = $2
          OR ($3::text IS NOT NULL AND product_slug = $3)
        )
      LIMIT 1`,
    [userId, ag, slug]
  );
  if (r.rows.length > 0) return true;

  if (slug) {
    const legacy = await pool.query(
      `SELECT 1 FROM orders
        WHERE user_id = $1
          AND status IN ('paid', 'partial_refund')
          AND product_slug = $2
        LIMIT 1`,
      [userId, slug]
    );
    if (legacy.rows.length > 0) return true;
  }

  return false;
}

export async function markUserAssetPurchaseRefundedByTransaction(
  paddleTransactionId: string
): Promise<void> {
  await pool.query(
    `UPDATE user_asset_purchases
        SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
      WHERE paddle_transaction_id = $1`,
    [paddleTransactionId.trim()]
  );
}

export type PurchasedAssetListItem = {
  id: string;
  asset_group_key: string;
  product_slug: string | null;
  purchased_at: string;
  display_title: string | null;
  country_slug: string | null;
};

export async function listUserPurchasedAssets(userId: string): Promise<PurchasedAssetListItem[]> {
  const r = await pool.query<PurchasedAssetListItem>(
    `SELECT
        uap.id,
        uap.asset_group_key,
        uap.product_slug,
        uap.purchased_at::text AS purchased_at,
        (
          SELECT cff.display_title
            FROM country_flag_files cff
           WHERE cff.status = 'published'
             AND (
               (cff.asset_group_key IS NOT NULL AND lower(trim(cff.asset_group_key)) = uap.asset_group_key)
               OR uap.asset_group_key LIKE 'solo:%' AND cff.id::text = substring(uap.asset_group_key from 6)
             )
           ORDER BY cff.created_at ASC
           LIMIT 1
        ) AS display_title,
        (
          SELECT c.slug
            FROM country_flag_files cff
            JOIN countries c ON c.id = cff.country_id
           WHERE cff.status = 'published'
             AND (
               (cff.asset_group_key IS NOT NULL AND lower(trim(cff.asset_group_key)) = uap.asset_group_key)
               OR uap.asset_group_key LIKE 'solo:%' AND cff.id::text = substring(uap.asset_group_key from 6)
             )
           LIMIT 1
        ) AS country_slug
       FROM user_asset_purchases uap
      WHERE uap.user_id = $1 AND uap.status = 'paid'
      ORDER BY uap.purchased_at DESC`,
    [userId]
  );
  return r.rows;
}
