import { Pool } from 'pg';

/**
 * pg ≥8 / pg-connection-string warns when `sslmode` is require/prefer/verify-ca because
 * future libpq-compatible parsing will treat those modes differently. Neon URLs typically use
 * `sslmode=require`. Mapping to `verify-full` preserves today's strict TLS verification and
 * removes the startup warning. Localhost URLs are left unchanged.
 *
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
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
      connectionString: normalizeDatabaseUrlForPg(url),
      max: Number(process.env.PG_POOL_MAX ?? 8),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}
