/**
 * Clerk-admin flag file upload → Cloudflare R2 + Neon `country_flag_files`.
 *
 * Mounted at POST /api/admin/flag-files/upload
 * Frontend proxies here after verifying the same user on Vercel (optional double-check).
 */

import express, { type Response } from 'express';
import multer from 'multer';
import { extname, basename } from 'path';
import pool from '../db.js';
import { verifyClerkAdminBearer } from '../auth/clerk-admin.server.js';
import {
  buildFlagObjectKey,
  requireR2Config,
  sha256Hex,
  uploadFileToR2,
} from '../storage/r2.js';
import { runR2Import } from '../scripts/import-r2-files.js';

const FORMATS = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'pdf', 'eps', 'ai', 'psd'] as const;
const PREMIUM = ['free', 'freemium', 'paid'] as const;
const COUNTRY_CATEGORIES = ['country', 'autonomy', 'organization', 'historical'] as const;

type Format = (typeof FORMATS)[number];
type Premium = (typeof PREMIUM)[number];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 },
});

const router = express.Router();

router.post('/import-r2', async (req: express.Request, res: Response) => {
  const gate = await verifyClerkAdminBearer(req.headers.authorization);
  if (!gate.ok) {
    return res.status(gate.status).json({ error: gate.error, code: gate.code });
  }

  try {
    requireR2Config();
  } catch {
    return res.status(503).json({
      error: 'R2 storage is not configured on the API server.',
      code: 'r2_config',
    });
  }

  const rawMax = req.query.maxObjects ?? req.query.max;
  let maxObjects = 25_000;
  if (rawMax !== undefined) {
    const raw = Array.isArray(rawMax) ? rawMax[0] : rawMax;
    const n = Number(raw);
    if (Number.isFinite(n)) {
      maxObjects = Math.min(100_000, Math.max(1, Math.floor(n)));
    }
  }

  const rawPrefix = req.query.prefix;
  const prefix =
    typeof rawPrefix === 'string'
      ? rawPrefix.trim()
      : Array.isArray(rawPrefix) && typeof rawPrefix[0] === 'string'
        ? rawPrefix[0].trim()
        : '';

  try {
    const stats = await runR2Import({
      maxObjects,
      prefix: prefix || undefined,
      pool,
    });
    return res.json({ ok: true, ...stats });
  } catch (err: unknown) {
    console.error('[flag-files-import-r2]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Import failed',
      code: 'import_failed',
    });
  }
});

async function resolveCountryId(
  name: string,
  slug: string,
  region: string | null | undefined,
  category: string
): Promise<{ id: string; created: boolean }> {
  const found = await pool.query<{ id: string }>('SELECT id FROM countries WHERE lower(slug) = lower($1) LIMIT 1', [
    slug,
  ]);
  if (found.rows[0]?.id) {
    return { id: found.rows[0].id, created: false };
  }
  const ins = await pool.query<{ id: string }>(
    `INSERT INTO countries (name, slug, region, category, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING id`,
    [name, slug.toLowerCase(), region?.trim() || null, category]
  );
  return { id: ins.rows[0]!.id, created: true };
}

function parseTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function isPgLikeError(err: unknown): err is { code?: string; message?: string } {
  return typeof err === 'object' && err !== null && ('code' in err || 'message' in err);
}

router.post('/upload', upload.single('file'), async (req: express.Request, res: Response) => {
  const gate = await verifyClerkAdminBearer(req.headers.authorization);
  if (!gate.ok) {
    return res.status(gate.status).json({ error: gate.error, code: gate.code });
  }

  let cfg;
  try {
    cfg = requireR2Config();
  } catch (e) {
    console.error('[flag-files-upload] R2 config:', e);
    return res.status(503).json({
      error: 'R2 storage is not configured on the API server.',
      code: 'r2_config',
    });
  }

  const file = req.file;
  if (!file?.buffer) {
    return res.status(400).json({ error: 'Missing file.', code: 'validation' });
  }

  const country_name = String(req.body?.country_name ?? '').trim();
  const country_slug = String(req.body?.country_slug ?? '').trim().toLowerCase();
  const region = req.body?.region ? String(req.body.region) : '';
  const category = String(req.body?.category ?? 'country').toLowerCase();
  const flag_title = String(req.body?.flag_title ?? '').trim();
  const format = String(req.body?.format ?? '').toLowerCase() as Format;
  const premium_tier = String(req.body?.premium_tier ?? '').toLowerCase() as Premium;
  const price_cents = Math.max(0, Math.round(Number(req.body?.price_cents ?? 0)));
  const tagsRaw = req.body?.tags ? String(req.body.tags) : '';
  const status = String(req.body?.status ?? 'published').toLowerCase();

  if (!country_name || !country_slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(country_slug)) {
    return res.status(400).json({ error: 'Invalid country name or slug.', code: 'validation' });
  }
  if (!flag_title) {
    return res.status(400).json({ error: 'Flag title is required.', code: 'validation' });
  }
  if (!FORMATS.includes(format)) {
    return res.status(400).json({ error: 'Invalid format.', code: 'validation' });
  }
  if (!PREMIUM.includes(premium_tier)) {
    return res.status(400).json({ error: 'Invalid premium_tier.', code: 'validation' });
  }
  if (!COUNTRY_CATEGORIES.includes(category as (typeof COUNTRY_CATEGORIES)[number])) {
    return res.status(400).json({ error: 'Invalid category.', code: 'validation' });
  }
  if (status !== 'draft' && status !== 'published') {
    return res.status(400).json({ error: 'Invalid status.', code: 'validation' });
  }

  const mime = file.mimetype?.trim() || 'application/octet-stream';
  const size = file.size;
  if (!Number.isFinite(size) || size <= 0) {
    return res.status(400).json({ error: 'Invalid file size.', code: 'validation' });
  }

  const ext = format === 'jpeg' ? 'jpeg' : format;
  const objectKey = buildFlagObjectKey(country_slug, flag_title, `${flag_title}.${ext}`);

  try {
    const { id: countryId, created } = await resolveCountryId(
      country_name,
      country_slug,
      region || null,
      category
    );

    const { key, publicUrl } = await uploadFileToR2(file.buffer, objectKey, mime, cfg);
    const checksum = sha256Hex(file.buffer);
    const tagsArr = parseTags(tagsRaw);

    const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(format);
    const previewUrl = imgLike ? publicUrl : null;
    const thumbUrl = previewUrl;

    const metadataPayload = JSON.stringify({
      region: region?.trim() || null,
      country_created_stub: created,
      uploaded_via: 'admin_flag_upload_r2',
      clerk_user_id: gate.userId,
    });

    const ins = await pool.query<{
      id: string;
      file_url: string;
      file_name: string;
      created_at: string;
      status: string;
      file_key: string | null;
    }>(
      `INSERT INTO country_flag_files (
        country_id, file_name, file_path, file_url, file_key, storage_provider,
        file_size_bytes, mime_type,
        format, variant_name, ratio, premium_tier, price_cents, tags, metadata, status,
        processing_status, thumbnail_url, preview_url, checksum
      ) VALUES (
        $1, $2, $3, $4, $5, 'r2',
        $6, $7,
        $8, $9, NULL, $10, $11, $12, $13::jsonb, $14,
        'completed', $15, $16, $17
      )
      RETURNING id, file_url, file_name, created_at, status, file_key`,
      [
        countryId,
        flag_title,
        key,
        publicUrl,
        key,
        size,
        mime,
        format,
        flag_title,
        premium_tier,
        price_cents,
        tagsArr,
        metadataPayload,
        status,
        thumbUrl,
        previewUrl,
        checksum,
      ]
    );

    const row = ins.rows[0]!;
    return res.status(201).json({
      success: true,
      ok: true,
      file_url: publicUrl,
      file_key: key,
      file_name: flag_title,
      format,
      country_slug,
      id: row.id,
      file: row,
      country_id: countryId,
      country_created_stub: created,
    });
  } catch (err: unknown) {
    console.error('[flag-files-upload]', err);

    const pgCode = isPgLikeError(err) && err.code ? String(err.code) : '';
    const pgMessage =
      process.env.NODE_ENV !== 'production' && isPgLikeError(err) && err.message
        ? String(err.message)
        : undefined;

    if (pgCode === '23505') {
      return res.status(409).json({
        error:
          'A flag file already exists for this country with the same title, format, and ratio. Change the flag title or format.',
        code: 'duplicate',
      });
    }

    if (pgCode === '42703') {
      return res.status(503).json({
        error:
          'Database is missing columns (file_key / storage_provider / preview_url). Run migration neon_003_country_flag_files_r2_columns.sql.',
        code: 'database_schema',
        ...(pgMessage ? { detail: pgMessage } : {}),
      });
    }

    return res.status(500).json({
      error: 'Upload failed',
      code: 'server_error',
      ...(pgMessage ? { detail: pgMessage } : {}),
    });
  }
});

/**
 * POST /upload-batch
 * Multi-file upload with new R2 key format: flags/{countrySlug}/{folder}/{filename}
 * Folder is determined by file extension or explicit type (video/mockup).
 */
router.post('/upload-batch', upload.array('files', 50), async (req: express.Request, res: Response) => {
  const gate = await verifyClerkAdminBearer(req.headers.authorization);
  if (!gate.ok) {
    return res.status(gate.status).json({ error: gate.error, code: gate.code });
  }

  let cfg;
  try {
    cfg = requireR2Config();
  } catch {
    return res.status(503).json({ error: 'R2 storage is not configured on the API server.', code: 'r2_config' });
  }

  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) {
    return res.status(400).json({ error: 'No files received.', code: 'validation' });
  }

  const countrySlug = String(req.body?.countrySlug ?? '').trim().toLowerCase();
  const countryName = String(req.body?.countryName ?? '').trim();
  const countryCode = String(req.body?.countryCode ?? '').trim().toLowerCase();

  if (!countrySlug || !countryName) {
    return res.status(400).json({ error: 'countrySlug and countryName are required.', code: 'validation' });
  }

  let metadataArr: Record<string, unknown>[] = [];
  try {
    const raw = req.body?.metadata;
    if (typeof raw === 'string') metadataArr = JSON.parse(raw) as Record<string, unknown>[];
    else if (Array.isArray(raw)) metadataArr = raw.map(m => (typeof m === 'string' ? JSON.parse(m) : m)) as Record<string, unknown>[];
  } catch { metadataArr = []; }

  let countryId: string;
  try {
    const result = await resolveCountryId(countryName, countrySlug, null, 'country');
    countryId = result.id;
  } catch (err) {
    console.error('[upload-batch] resolveCountryId failed:', err);
    return res.status(500).json({ error: 'Failed to resolve country.', code: 'db_error' });
  }

  const settled = await Promise.allSettled(
    files.map(async (file, i) => {
      const meta = metadataArr[i] ?? {};
      const originalName = file.originalname;
      const ext = extname(originalName).replace(/^\./, '').toLowerCase() || 'bin';
      const flagType = String(meta.type ?? 'Flat');

      const folder =
        flagType === 'Video' || ['mp4', 'mov', 'webm', 'avi'].includes(ext)
          ? 'video'
          : flagType === 'Mockup'
            ? 'mockup'
            : ext;

      const objectKey = `flags/${countrySlug}/${folder}/${originalName}`;
      const mime = file.mimetype || 'application/octet-stream';
      const { key, publicUrl } = await uploadFileToR2(file.buffer, objectKey, mime, cfg!);
      const checksum = sha256Hex(file.buffer);

      const isPremium = meta.isPremium === true;
      const premiumTier = isPremium ? 'paid' : 'free';
      const priceCents = isPremium ? Math.round((Number(meta.price) || 3) * 100) : 0;
      const shape = meta.shape ? String(meta.shape) : null;
      const variantName = shape ? `${flagType} ${shape}` : flagType;

      const imgLike = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext);
      const previewUrl = imgLike ? publicUrl : null;

      const dbFormat = FORMATS.includes(ext as Format) ? (ext as Format) : 'svg';
      const keywords = String(meta.keywords ?? '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
        .slice(0, 50);

      const metaJson = JSON.stringify({
        flag_type: flagType,
        shape,
        country_code: countryCode,
        uploaded_via: 'admin_batch_upload_v2',
        clerk_user_id: gate.userId,
      });

      const nameWithoutExt = basename(originalName, extname(originalName));

      const ins = await pool.query<{ id: string; file_url: string; file_key: string }>(
        `INSERT INTO country_flag_files (
          country_id, file_name, file_path, file_url, file_key, storage_provider,
          file_size_bytes, mime_type, format, variant_name, ratio, premium_tier,
          price_cents, tags, metadata, status, processing_status,
          thumbnail_url, preview_url, checksum
        ) VALUES (
          $1,$2,$3,$4,$5,'r2',$6,$7,$8,$9,NULL,$10,$11,$12,$13::jsonb,'published','completed',$14,$15,$16
        )
        ON CONFLICT (file_key) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id, file_url, file_key`,
        [
          countryId, nameWithoutExt, key, publicUrl, key,
          file.size, mime, dbFormat, variantName, premiumTier,
          priceCents, keywords, metaJson, previewUrl, previewUrl, checksum,
        ]
      );

      return { ok: true, fileName: originalName, id: ins.rows[0]!.id, fileUrl: publicUrl, r2Key: key };
    })
  );

  const results = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          ok: false,
          fileName: files[i]?.originalname ?? `file-${i}`,
          error: (r.reason as Error)?.message ?? 'Upload failed',
        }
  );

  const successCount = results.filter(r => r.ok).length;
  const status = successCount === files.length ? 201 : successCount > 0 ? 207 : 500;

  return res.status(status).json({
    ok: successCount === files.length,
    results,
    successCount,
    errorCount: results.length - successCount,
    r2Prefix: `flags/${countrySlug}/`,
  });
});

export default router;
