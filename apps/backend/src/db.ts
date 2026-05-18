import { Pool, PoolConfig } from 'pg';
import { runMigrations } from './db/migrations.js';

/**
 * Neon and other hosts often use `sslmode=require`. Node `pg` treats require/prefer/verify-ca
 * like verify-full today but will align with libpq in pg v9 — explicit verify-full keeps strict
 * TLS and avoids the migration warning. Localhost strings are unchanged.
 */
function normalizeDatabaseUrlForPg(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    return connectionString;
  }
  const host = parsed.hostname.toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (isLocal) return connectionString;

  const mode = parsed.searchParams.get('sslmode')?.toLowerCase() ?? '';
  if (mode === 'require' || mode === 'prefer' || mode === 'verify-ca') {
    parsed.searchParams.set('sslmode', 'verify-full');
    return parsed.href;
  }
  return connectionString;
}

const rawConnectionString =
  process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/flagstock';

const poolConfig: PoolConfig = {
  connectionString: normalizeDatabaseUrlForPg(rawConnectionString),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database on first connection
let migrationsRun = false;
pool.on('connect', async () => {
  if (!migrationsRun) {
    migrationsRun = true;
    try {
      await runMigrations(pool);
    } catch (error) {
      console.error('Failed to run migrations:', error);
    }
  }
});

export default pool;
