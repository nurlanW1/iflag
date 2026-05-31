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
    const ag = explicit.toLowerCase();
    const marketplaceSlug =
      slug !== 'flag-stock' ? slug : slugFromAssetGroupKey(ag);
    return {
      assetGroupKey: ag,
      productSlug: marketplaceSlug,
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

/**
 * Resolve purchased asset identity from checkout body (not Paddle price slug).
 */
export async function resolvePurchaseTargetFromAsset(params: {
  assetGroupKey?: string | null;
  assetId?: string | null;
  fileId?: string | null;
  assetProductSlug?: string | null;
  countrySlug?: string | null;
}): Promise<PurchaseTarget | null> {
  const fileId = (params.assetId ?? params.fileId)?.trim();
  const agIn = params.assetGroupKey?.trim().toLowerCase();
  const marketplaceSlug = params.assetProductSlug?.trim().toLowerCase() || null;

  if (fileId && /^[0-9a-f-]{36}$/i.test(fileId)) {
    const r = await pool.query<{
      id: string;
      asset_group_key: string | null;
      country_slug: string | null;
    }>(
      `SELECT cff.id, cff.asset_group_key, c.slug AS country_slug
         FROM country_flag_files cff
         LEFT JOIN countries c ON c.id = cff.country_id
        WHERE cff.id = $1::uuid AND cff.status = 'published'
        LIMIT 1`,
      [fileId]
    );
    const row = r.rows[0];
    if (!row) return null;
    const ag = row.asset_group_key?.trim().toLowerCase() || soloAssetGroupKey(row.id);
    return {
      assetGroupKey: ag,
      productSlug: marketplaceSlug || slugFromAssetGroupKey(ag) || `nf-${row.id.toLowerCase()}`,
      assetId: row.id,
    };
  }

  if (agIn) {
    let assetId: string | null = fileId && /^[0-9a-f-]{36}$/i.test(fileId) ? fileId : null;
    if (!assetId) {
      const r = await pool.query<{ id: string }>(
        `SELECT id FROM country_flag_files
          WHERE status = 'published' AND lower(trim(asset_group_key)) = $1
          ORDER BY created_at ASC
          LIMIT 1`,
        [agIn]
      );
      assetId = r.rows[0]?.id ?? null;
    }
    return {
      assetGroupKey: agIn,
      productSlug: marketplaceSlug || slugFromAssetGroupKey(agIn),
      assetId,
    };
  }

  if (marketplaceSlug && marketplaceSlug !== 'flag-stock') {
    return resolvePurchaseTarget({ productSlug: marketplaceSlug, assetGroupKey: null });
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
