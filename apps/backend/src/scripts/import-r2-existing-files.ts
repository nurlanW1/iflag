/**
 * Import existing R2 object keys into Neon `country_flag_files`.
 *
 * Usage (after `npm run build` in apps/backend):
 *   node dist/scripts/import-r2-existing-files.js path/to/files.json
 *
 * JSON: array of { country_slug, file_key, file_url, file_name, format, variant_name?, premium_tier?, ... }
 *
 * TODO: Legacy rows with storage_provider='vercel_blob' stay untouched; this script is for R2 keys only.
 */

import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';

type RowIn = {
  country_slug: string;
  file_key: string;
  file_url: string;
  file_name: string;
  format: string;
  variant_name?: string;
  premium_tier?: string;
  preview_url?: string;
  thumbnail_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  tags?: string[];
  status?: string;
};

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node dist/scripts/import-r2-existing-files.js <json-file>');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const raw = fs.readFileSync(path, 'utf-8');
  const rows = JSON.parse(raw) as RowIn[];
  if (!Array.isArray(rows)) {
    console.error('JSON root must be an array');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: url });

  try {
    for (const r of rows) {
      const slug = r.country_slug?.trim().toLowerCase();
      const fileKey = r.file_key?.trim();
      if (!slug || !fileKey || !r.file_url?.trim()) {
        console.warn('Skipping invalid row', r);
        continue;
      }

      const dup = await pool.query('SELECT 1 FROM country_flag_files WHERE file_key = $1 LIMIT 1', [fileKey]);
      if (dup.rows.length > 0) {
        console.log('Skip duplicate file_key', fileKey);
        continue;
      }

      const c = await pool.query<{ id: string }>(
        'SELECT id FROM countries WHERE lower(slug)=lower($1) LIMIT 1',
        [slug]
      );
      if (!c.rows[0]) {
        console.warn('Country not found for slug', slug);
        continue;
      }
      const countryId = c.rows[0].id;
      const variant = r.variant_name?.trim() || r.file_name.trim();
      const fmt = r.format.trim().toLowerCase();
      const tier = (r.premium_tier || 'free').toLowerCase();
      const status = (r.status || 'published').toLowerCase();
      const size = Number(r.file_size_bytes) > 0 ? Number(r.file_size_bytes) : 1;
      const mime = r.mime_type?.trim() || 'application/octet-stream';
      const preview = r.preview_url?.trim() || null;
      const thumb = r.thumbnail_url?.trim() || preview;

      await pool.query(
        `INSERT INTO country_flag_files (
          country_id, file_name, file_path, file_url, file_key, storage_provider,
          file_size_bytes, mime_type, format, variant_name, ratio,
          premium_tier, price_cents, tags, metadata, status,
          processing_status, thumbnail_url, preview_url
        ) VALUES (
          $1,$2,$3,$4,$5,'r2',
          $6,$7,$8,$9,NULL,
          $10,0,$11::text[],$12::jsonb,$13,
          'completed',$14,$15
        )`,
        [
          countryId,
          r.file_name.trim(),
          fileKey,
          r.file_url.trim(),
          fileKey,
          size,
          mime,
          fmt,
          variant,
          tier,
          r.tags || [],
          JSON.stringify({ imported_via: 'import-r2-existing-files' }),
          status,
          thumb,
          preview,
        ]
      );
      console.log('Inserted:', fileKey);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
