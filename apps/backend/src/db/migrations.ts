import { Pool } from 'pg';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve the directory containing SQL files.
 * In dev (ts-node-dev) `__dirname` already points at src/db.
 * In prod (compiled), `__dirname` is dist/db — but the SQL files live in src/db.
 * We try the runtime dir first, then walk up to find a `src/db` sibling.
 */
function resolveSqlDir(): string {
  if (existsSync(join(__dirname, 'schema.sql'))) return __dirname;
  const fromDist = join(__dirname, '..', '..', 'src', 'db');
  if (existsSync(join(fromDist, 'schema.sql'))) return fromDist;
  return __dirname;
}

/**
 * Migration runner.
 *
 * Tracks two parallel histories on `schema_migrations`:
 *   - integer `version` for the original schema.sql baseline (legacy: version 1).
 *   - `name` for file-based migrations under `db/migrations/*.sql` (one row per file).
 *
 * Files are applied in lexicographic order (so prefix with `001_`, `002_`, etc.).
 * Each file is wrapped in a transaction; partial application is impossible.
 */
export async function runMigrations(pool: Pool): Promise<void> {
  try {
    // Ensure migrations table exists with both columns.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER,
        name VARCHAR(255),
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add `name` column on pre-existing installations that only had `version`.
    await pool.query(`
      ALTER TABLE schema_migrations
      ADD COLUMN IF NOT EXISTS name VARCHAR(255)
    `);

    // Apply baseline schema if never applied.
    await applyBaselineIfNeeded(pool);

    // Apply file migrations.
    await applyFileMigrations(pool);
  } catch (error) {
    console.error('[migrations] error:', error);
    throw error;
  }
}

async function applyBaselineIfNeeded(pool: Pool): Promise<void> {
  const result = await pool.query(
    'SELECT MAX(version) as v FROM schema_migrations WHERE version IS NOT NULL'
  );
  const currentVersion: number = result.rows[0]?.v ?? 0;
  if (currentVersion > 0) return;

  const sqlDir = resolveSqlDir();
  const schemaPath = join(sqlDir, 'schema.sql');
  if (!existsSync(schemaPath)) {
    console.warn('[migrations] schema.sql not found, skipping baseline.');
    return;
  }
  const schema = readFileSync(schemaPath, 'utf-8');

  // schema.sql contains plpgsql functions with $$ blocks — splitting on `;`
  // breaks them. Run the entire script as a single query.
  await pool.query(schema);
  await pool.query(
    'INSERT INTO schema_migrations (version, name) VALUES (1, $1)',
    ['baseline_schema.sql']
  );
  console.log('[migrations] baseline schema applied (version 1).');
}

async function applyFileMigrations(pool: Pool): Promise<void> {
  const migrationsDir = join(resolveSqlDir(), 'migrations');
  if (!existsSync(migrationsDir)) {
    return;
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) return;

  const appliedResult = await pool.query(
    'SELECT name FROM schema_migrations WHERE name IS NOT NULL'
  );
  const applied = new Set<string>(appliedResult.rows.map((r: any) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`[migrations] applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrations] failed: ${file}`, err);
      throw err;
    } finally {
      client.release();
    }
  }
}
