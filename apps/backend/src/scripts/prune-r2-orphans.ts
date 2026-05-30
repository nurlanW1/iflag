/**
 * Remove catalog rows whose R2 object no longer exists (deleted from bucket only).
 *
 * Site reads Neon `country_flag_files` with status=published — not R2 directly.
 * After deleting objects in Cloudflare, run this to archive or delete stale rows.
 *
 *   npm run build --workspace=backend
 *   npm run prune:r2                    # dry-run (default)
 *   npm run prune:r2 -- --apply         # set status=archived
 *   npm run prune:r2 -- --apply --delete  # DELETE rows (irreversible)
 *
 * Env: same as import:r2 (DATABASE_URL, CLOUDFLARE_R2_*)
 * Optional: PRUNE_R2_PREFIX, IMPORT_R2_PREFIX (list prefix, default all bucket keys)
 */

import dotenv from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { listR2ObjectSummaries, requireR2Config } from '../storage/r2.js';
import { createScriptPool, verifyScriptDbConnection } from '../lib/script-db-pool.js';

const __scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__scriptDir, '../../.env') });

export type PruneR2Stats = {
  r2Keys: number;
  dbPublished: number;
  orphans: number;
  archived: number;
  deleted: number;
  samples: string[];
};

function normalizeR2Key(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/^\/+/, '');
}

type DbRow = {
  id: string;
  file_key: string | null;
  file_path: string | null;
  file_name: string;
  country_slug: string | null;
};

export type PruneR2Options = {
  prefix?: string;
  apply?: boolean;
  deleteRows?: boolean;
  pool?: pg.Pool;
};

export async function runPruneR2Orphans(opts: PruneR2Options = {}): Promise<PruneR2Stats> {
  const stats: PruneR2Stats = {
    r2Keys: 0,
    dbPublished: 0,
    orphans: 0,
    archived: 0,
    deleted: 0,
    samples: [],
  };

  const cfg = requireR2Config();
  const ownPool = !opts.pool;
  const pool = opts.pool ?? (await createScriptPool());
  if (ownPool) await verifyScriptDbConnection(pool);

  const prefix =
    opts.prefix?.trim() ||
    process.env.PRUNE_R2_PREFIX?.trim() ||
    process.env.IMPORT_R2_PREFIX?.trim() ||
    undefined;

  try {
    const summaries = await listR2ObjectSummaries(cfg, { prefix });
    const r2Set = new Set<string>();
    for (const o of summaries) {
      const k = normalizeR2Key(o.key);
      if (k) r2Set.add(k);
    }
    stats.r2Keys = r2Set.size;

    const res = await pool.query<DbRow>(
      `SELECT id,
              NULLIF(trim(file_key::text), '') AS file_key,
              NULLIF(trim(file_path::text), '') AS file_path,
              file_name,
              NULLIF(trim(country_slug::text), '') AS country_slug
       FROM country_flag_files
       WHERE lower(trim(coalesce(status::text, ''))) = 'published'
         AND (
           NULLIF(trim(file_key::text), '') IS NOT NULL
           OR NULLIF(trim(file_path::text), '') IS NOT NULL
         )
         AND lower(trim(coalesce(storage_provider::text, 'r2'))) IN ('r2', '')`,
    );
    stats.dbPublished = res.rows.length;

    const orphanIds: string[] = [];

    for (const row of res.rows) {
      const key = normalizeR2Key(row.file_key) || normalizeR2Key(row.file_path);
      if (!key) continue;
      if (r2Set.has(key)) continue;

      orphanIds.push(row.id);
      if (stats.samples.length < 40) {
        const where = row.country_slug ? `${row.country_slug}/` : '';
        stats.samples.push(`${where}${row.file_name} [${key}]`);
      }
    }

    stats.orphans = orphanIds.length;

    if (!opts.apply || orphanIds.length === 0) {
      return stats;
    }

    if (opts.deleteRows) {
      const del = await pool.query(
        `DELETE FROM country_flag_files WHERE id = ANY($1::uuid[])`,
        [orphanIds],
      );
      stats.deleted = del.rowCount ?? orphanIds.length;
    } else {
      const upd = await pool.query(
        `UPDATE country_flag_files
         SET status = 'archived',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1::uuid[])
           AND lower(trim(coalesce(status::text, ''))) = 'published'`,
        [orphanIds],
      );
      stats.archived = upd.rowCount ?? 0;
    }
  } finally {
    if (ownPool) await pool.end();
  }

  return stats;
}

function printSummary(stats: PruneR2Stats, opts: PruneR2Options) {
  const mode = !opts.apply ? 'DRY RUN' : opts.deleteRows ? 'DELETE' : 'ARCHIVE';
  console.log(`[prune:r2] mode: ${mode}`);
  console.log('[prune:r2] r2 object keys listed', stats.r2Keys);
  console.log('[prune:r2] published db rows (r2)', stats.dbPublished);
  console.log('[prune:r2] orphans (in db, missing in r2)', stats.orphans);
  if (opts.apply) {
    if (opts.deleteRows) {
      console.log('[prune:r2] deleted', stats.deleted);
    } else {
      console.log('[prune:r2] archived', stats.archived);
    }
  } else if (stats.orphans > 0) {
    console.log('[prune:r2] re-run with --apply to archive, or --apply --delete to remove rows');
  }
  if (stats.samples.length) {
    console.log('[prune:r2] samples:');
    for (const s of stats.samples) console.log(`  • ${s}`);
  }
}

async function cliMain() {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const deleteRows = argv.includes('--delete');
  if (deleteRows && !apply) {
    console.error('[prune:r2] --delete requires --apply');
    process.exit(1);
  }

  const stats = await runPruneR2Orphans({ apply, deleteRows });
  printSummary(stats, { apply, deleteRows });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  cliMain().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
