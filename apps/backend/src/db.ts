import { Pool, neonConfig } from '@neondatabase/serverless';
import type { Pool as PgPool } from 'pg';
import ws from 'ws';

/**
 * Lazy pool initialization — DATABASE_URL is read on first use,
 * AFTER dotenv has loaded env vars. This avoids ESM import-hoisting
 * issues where module-level code runs before dotenvConfig().
 */
neonConfig.webSocketConstructor = ws;

let _pool: PgPool | undefined;

function getPool(): PgPool {
  if (!_pool) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url || url.includes('localhost:5432')) {
      console.error('[db] DATABASE_URL not set or points to localhost — check .env');
    }
    const connectionString = url || 'postgresql://user:password@localhost:5432/flagstock';
    _pool = new Pool({ connectionString, max: 10 }) as unknown as PgPool;
    (_pool as any).on?.('error', (err: Error) => {
      console.error('[db] Pool error:', err.message);
    });
  }
  return _pool;
}

/** Proxy that forwards all pg.Pool methods to the lazily-created pool. */
const pool = new Proxy({} as PgPool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export default pool;
