import { Pool } from 'pg';
import type { Pool as PgPool } from 'pg';

let _pool: PgPool | undefined;

function buildConnectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || url.includes('localhost:5432/flagstock')) {
    console.warn('[db] DATABASE_URL not set or using placeholder — check .env');
    return 'postgresql://user:password@localhost:5432/flagstock';
  }

  // Ensure sslmode=require is present for non-local Neon connections.
  // Do NOT pass a custom ssl:{} option — let pg use Node.js default TLS
  // (system CA store + standard negotiation). Custom ssl options can
  // break TLS handshake with Neon/PgBouncer on Railway.
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocal && !parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
      return parsed.href;
    }
  } catch {
    // Not a valid URL — use as-is
  }
  return url;
}

function getPool(): PgPool {
  if (!_pool) {
    const connectionString = buildConnectionString();
    _pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    _pool.on('error', (err: Error) => {
      console.error('[db] Pool error:', err.message);
    });
  }
  return _pool;
}

const pool = new Proxy({} as PgPool, {
  get(_target, prop: string | symbol) {
    const instance = getPool();
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return (val as (...args: unknown[]) => unknown).bind(instance);
    }
    return val;
  },
});

export default pool;
