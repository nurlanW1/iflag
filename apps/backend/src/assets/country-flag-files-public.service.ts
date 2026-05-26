/**
 * Public read API for Neon `country_flag_files` rows (published R2-backed flags).
 * Used by GET /api/assets and GET /api/assets/search — distinct from legacy `assets` CMS table.
 */

import pool from '../db.js';

export type PublishedCountryFlagDTO = {
  id: string;
  title: string | null;
  country_slug: string | null;
  country_name: string | null;
  file_name: string;
  file_key: string | null;
  file_path: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  format: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  variant_name: string | null;
  premium_tier: string | null;
  price_cents: number | null;
  watermark_enabled: boolean | null;
  tags: string[] | null;
  status: string;
  storage_provider: string | null;
  processing_status: string | null;
  iso_alpha_2: string | null;
  region: string | null;
  created_at: string;
  updated_at: string;
  /** Logical product grouping slug (hyphenated) — duplicates across formats collapse in catalog. */
  asset_group_key: string | null;
  display_title: string | null;
  ratio: string | null;
};

export type ListPublishedFlagsFilters = {
  q?: string;
  /** alias for q */
  search?: string;
  country_slug?: string;
  format?: string;
  premium_tier?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'title' | 'popular';
};

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date().toISOString();
}

function rowToDto(r: Record<string, unknown>): PublishedCountryFlagDTO {
  const n = (v: unknown) => (v == null ? null : typeof v === 'number' ? v : Number(v));
  const b = (v: unknown): boolean | null =>
    typeof v === 'boolean' ? v : v == null ? null : Boolean(v);

  const tagsRaw = r.tags;
  let tags: string[] | null = null;
  if (Array.isArray(tagsRaw)) {
    tags = tagsRaw.map((t) => String(t)).filter(Boolean);
  }

  return {
    id: String(r.id),
    title: r.title != null ? String(r.title) : null,
    country_slug: r.country_slug != null ? String(r.country_slug) : null,
    country_name: r.country_name != null ? String(r.country_name) : null,
    file_name: String(r.file_name ?? ''),
    file_key: r.file_key != null ? String(r.file_key) : null,
    file_path: r.file_path != null ? String(r.file_path) : null,
    file_url: r.file_url != null ? String(r.file_url) : null,
    thumbnail_url: r.thumbnail_url != null ? String(r.thumbnail_url) : null,
    preview_url: r.preview_url != null ? String(r.preview_url) : null,
    format: String(r.format ?? ''),
    mime_type: r.mime_type != null ? String(r.mime_type) : null,
    file_size_bytes: n(r.file_size_bytes) as number | null,
    variant_name: r.variant_name != null ? String(r.variant_name) : null,
    premium_tier: r.premium_tier != null ? String(r.premium_tier) : null,
    price_cents: n(r.price_cents) != null ? Math.round(Number(r.price_cents)) : null,
    watermark_enabled: b(r.watermark_enabled),
    tags,
    status: String(r.status ?? ''),
    storage_provider: r.storage_provider != null ? String(r.storage_provider) : null,
    processing_status:
      r.processing_status != null ? String(r.processing_status) : null,
    iso_alpha_2: r.iso_alpha_2 != null ? String(r.iso_alpha_2) : null,
    region: r.region != null ? String(r.region) : null,
    asset_group_key: r.asset_group_key != null ? String(r.asset_group_key) : null,
    display_title: r.display_title != null ? String(r.display_title) : null,
    ratio: r.ratio != null ? String(r.ratio) : null,
    created_at: toIso(r.created_at),
    updated_at: toIso(r.updated_at),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listPublishedCountryFlagFiles(
  filters: ListPublishedFlagsFilters
): Promise<{
  data: PublishedCountryFlagDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const defaultLimit = filters.country_slug?.trim() ? 200 : 24;
  const maxLimit = filters.country_slug?.trim() ? 500 : 100;
  const limit = Math.min(maxLimit, Math.max(1, filters.limit ?? defaultLimit));
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * limit;

  const q = (
    filters.q ??
    filters.search ??
    ''
  ).trim();

  const conds: string[] = [`lower(trim(coalesce(cff.status::text, ''))) = 'published'`];
  const params: unknown[] = [];

  let p = 1;
  if (q) {
    conds.push(
      `(cff.title ILIKE $${p} OR cff.file_name ILIKE $${p} OR cff.variant_name ILIKE $${p}
        OR COALESCE(cff.country_slug,'') ILIKE $${p} OR COALESCE(c.name,'') ILIKE $${p}
        OR CAST(cff.tags AS TEXT) ILIKE $${p})`
    );
    params.push(`%${q}%`);
    p++;
  }

  const cSlug = filters.country_slug?.trim();
  if (cSlug) {
    conds.push(
      `(lower(trim(COALESCE(cff.country_slug, c.slug,''))) = lower(trim($${p}))
        OR c.id IN (SELECT id FROM countries WHERE lower(trim(slug)) = lower(trim($${p}))))`,
    );
    params.push(cSlug, cSlug);
    p += 2;
  }

  const fmt = filters.format?.trim().toLowerCase();
  if (fmt) {
    conds.push(`lower(trim(cff.format)) = lower(trim($${p}))`);
    params.push(fmt);
    p++;
  }

  const tierRaw = filters.premium_tier?.trim().toLowerCase();
  if (tierRaw) {
    conds.push(`lower(trim(COALESCE(cff.premium_tier,''))) = lower(trim($${p}))`);
    params.push(tierRaw);
    p++;
  }

  const whereSql = conds.join(' AND ');

  const sortRaw = filters.sort ?? 'newest';
  let orderSql = 'cff.created_at DESC';
  if (sortRaw === 'oldest') orderSql = 'cff.created_at ASC';
  else if (sortRaw === 'title')
    orderSql = 'LOWER(COALESCE(cff.title, cff.variant_name, cff.file_name)) ASC';

  const countRes = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE ${whereSql}`,
    params
  );
  const total = Number.parseInt(countRes.rows[0]?.cnt ?? '0', 10) || 0;

  params.push(limit, offset);
  const limIdx = p;
  const offIdx = p + 1;

  const dataRes = await pool.query(
    `SELECT
       cff.id,
       cff.title,
       COALESCE(
         NULLIF(TRIM(BOTH FROM cff.country_slug), ''),
         NULLIF(TRIM(BOTH FROM c.slug), '')
       ) AS country_slug,
       c.name AS country_name,
       cff.file_name,
       cff.file_key,
       cff.file_path,
       cff.file_url,
       cff.thumbnail_url,
       cff.preview_url,
       cff.format,
       cff.mime_type,
       cff.file_size_bytes,
       cff.variant_name,
       cff.asset_group_key,
       cff.display_title,
       cff.ratio,
       cff.premium_tier,
       cff.price_cents,
       cff.watermark_enabled,
       cff.tags,
       cff.status,
       cff.storage_provider,
       cff.processing_status,
       c.iso_alpha_2 AS iso_alpha_2,
       COALESCE(c.region::text, NULL) AS region,
       cff.created_at,
       cff.updated_at
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE ${whereSql}
     ORDER BY ${orderSql}
     LIMIT $${limIdx} OFFSET $${offIdx}`,
    params
  );

  const data = dataRes.rows.map((row: Record<string, unknown>) => rowToDto(row));

  return {
    data,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

export async function getPublishedCountryFlagById(id: string): Promise<PublishedCountryFlagDTO | null> {
  if (!UUID_RE.test(id.trim())) return null;

  const dataRes = await pool.query(
    `SELECT
       cff.id,
       cff.title,
       COALESCE(
         NULLIF(TRIM(BOTH FROM cff.country_slug), ''),
         NULLIF(TRIM(BOTH FROM c.slug), '')
       ) AS country_slug,
       c.name AS country_name,
       cff.file_name,
       cff.file_key,
       cff.file_path,
       cff.file_url,
       cff.thumbnail_url,
       cff.preview_url,
       cff.format,
       cff.mime_type,
       cff.file_size_bytes,
       cff.variant_name,
       cff.asset_group_key,
       cff.display_title,
       cff.ratio,
       cff.premium_tier,
       cff.price_cents,
       cff.watermark_enabled,
       cff.tags,
       cff.status,
       cff.storage_provider,
       cff.processing_status,
       c.iso_alpha_2 AS iso_alpha_2,
       COALESCE(c.region::text, NULL) AS region,
       cff.created_at,
       cff.updated_at
     FROM country_flag_files cff
     LEFT JOIN countries c ON c.id = cff.country_id
     WHERE cff.id = $1::uuid AND cff.status = 'published'
     LIMIT 1`,
    [id.trim()]
  );
  const row = dataRes.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToDto(row);
}
