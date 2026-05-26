/**
 * Populate `country_flag_files.asset_group_key` and `display_title` when missing so
 * multi-format rows share one marketplace grouping key.
 *
 *   npm run build --prefix apps/backend
 *   npm run backfill:asset-groups --prefix apps/backend
 */
import dotenv from 'dotenv';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveAssetGroupKeyFromParts, deriveDisplayTitle } from '../lib/asset-group-key.js';
import { createScriptPool, verifyScriptDbConnection } from '../lib/script-db-pool.js';

const __scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__scriptDir, '../../.env') });

async function main() {
  const pool = await createScriptPool();
  await verifyScriptDbConnection(pool);
  try {
    const res = await pool.query<{
      id: string;
      file_name: string;
      file_path: string | null;
      country_slug: string | null;
      country_name: string | null;
    }>(
      `SELECT cff.id,
              cff.file_name,
              cff.file_path,
              c.slug AS country_slug,
              COALESCE(NULLIF(trim(c.name), ''), NULLIF(trim(c.slug), '')) AS country_name
       FROM country_flag_files cff
       LEFT JOIN countries c ON c.id = cff.country_id
       WHERE cff.asset_group_key IS NULL OR trim(cff.asset_group_key) = ''
          OR cff.display_title IS NULL OR trim(cff.display_title) = ''`
    );

    let n = 0;
    for (const row of res.rows) {
      const slug = row.country_slug?.trim() || 'unknown';
      const cn = row.country_name?.trim() || slug.replace(/[-_]/g, ' ');
      const stem = basename(String(row.file_name || 'asset'), extname(String(row.file_name || '')));
      const folders = dirname(String(row.file_path || '.').trim() || '.')
        .split(/[/\\\\]/g)
        .filter(Boolean);

      const ag = deriveAssetGroupKeyFromParts({
        countrySlug: slug,
        folderSegments: folders,
        fileStemNoExt: stem,
      }).slice(0, 240);

      const dt = deriveDisplayTitle({
        countryName: cn,
        fileStemNoExt: stem,
      }).slice(0, 250);

      await pool.query(
        `UPDATE country_flag_files
         SET asset_group_key = COALESCE(NULLIF(trim(asset_group_key), ''), $1),
             display_title = COALESCE(NULLIF(trim(display_title), ''), $2),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [ag, dt, row.id]
      );
      n++;
    }
    console.log(`[backfill-asset-groups] updated ${n} row(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
