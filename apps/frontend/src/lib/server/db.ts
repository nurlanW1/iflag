import { Pool } from 'pg';

/**
 * Server-only Postgres pool (Neon DATABASE_URL).
 * Never import from client components.
 */
let pool: Pool | undefined;

export function getDb(): Pool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('[db] DATABASE_URL is not configured');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX ?? 8),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}
