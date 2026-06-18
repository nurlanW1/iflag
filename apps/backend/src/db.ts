import { Pool } from 'pg';
import type { Pool as PgPool } from 'pg';

let _pool: PgPool | undefined;

function getPool(): PgPool {
  if (!_pool) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url || url.includes('localhost:5432/flagstock')) {
      console.warn('[db] DATABASE_URL not set or using placeholder — check .env');
    }
    const connectionString = url || 'postgresql://user:password@localhost:5432/flagstock';
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    // Standard pg Pool. Replaced @neondatabase/serverless WebSocket pool which caused
    // SSL handshake failures on Railway (long-running Node.js, not serverless).
    _pool = new Pool({
      connectionString,
      ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
      max: 10,
    });
    (_pool as PgPool).on('error', (err: Error) => {
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
