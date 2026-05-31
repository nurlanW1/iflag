/**
 * Resolve marketplace product slugs ↔ stable `asset_group_key` for purchases.
 */

import pool from '../db.js';

/** Canonical PDP slug from stored `asset_group_key` (aligned with frontend). */
export function slugFromAssetGroupKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function soloAssetGroupKey(fileId: string): string {
  return `solo:${fileId.trim().toLowerCase()}`;
}

export type PurchaseTarget = {
  assetGroupKey: string;
  productSlug: string;
  assetId: string | null;
};

/**
 * Resolve checkout / ownership target from marketplace slug and optional explicit group key.
 */
export async function resolvePurchaseTarget(params: {
  productSlug: string;
  assetGroupKey?: string | null;
}): Promise<PurchaseTarget | null> {
  const slug = params.productSlug.trim().toLowerCase();
  if (!slug) return null;

  const explicit = params.assetGroupKey?.trim();
  if (explicit) {
    return {
      assetGroupKey: explicit.toLowerCase(),
      productSlug: slug,
      assetId: null,
    };
  }

  const soloMatch = slug.match(/^nf-([0-9a-f-]{36})$/i);
  if (soloMatch) {
    const fileId = soloMatch[1]!;
    const r = await pool.query<{ id: string; asset_group_key: string | null }>(
      `SELECT id, asset_group_key
         FROM country_flag_files
        WHERE id = $1::uuid AND status = 'published'
        LIMIT 1`,
      [fileId]
    );
    const row = r.rows[0];
    if (!row) return null;
    const ag = row.asset_group_key?.trim();
    return {
      assetGroupKey: ag ? ag.toLowerCase() : soloAssetGroupKey(row.id),
      productSlug: slug,
      assetId: row.id,
    };
  }

  const candidates = await pool.query<{
    asset_group_key: string;
    id: string;
  }>(
    `SELECT DISTINCT ON (asset_group_key) asset_group_key, id
       FROM country_flag_files
      WHERE status = 'published'
        AND asset_group_key IS NOT NULL
        AND btrim(asset_group_key) <> ''
      ORDER BY asset_group_key, created_at ASC`
  );

  for (const row of candidates.rows) {
    const ag = row.asset_group_key.trim().toLowerCase();
    if (slugFromAssetGroupKey(ag) === slug) {
      return {
        assetGroupKey: ag,
        productSlug: slug,
        assetId: row.id,
      };
    }
  }

  return null;
}

/** Stable group key for a Neon `country_flag_files` row. */
export function assetGroupKeyForFileRow(row: {
  id: string;
  asset_group_key?: string | null;
}): string {
  const ag = row.asset_group_key?.trim();
  if (ag) return ag.toLowerCase();
  return soloAssetGroupKey(row.id);
}
