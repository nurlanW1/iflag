import { Pool, neonConfig } from '@neondatabase/serverless';
import type { Pool as PgPool } from 'pg';
import ws from 'ws';

/**
 * Lazy pool initialization — DATABASE_URL is read on first use,
 * AFTER dotenv has loaded env vars. Fixes ESM import-hoisting issue.
 *
 * Proxy correctly binds all method calls to the actual Pool instance.
 */
neonConfig.webSocketConstructor = ws;

let _pool: InstanceType<typeof Pool> | undefined;

function getPool(): InstanceType<typeof Pool> {
  if (!_pool) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url || url.includes('localhost:5432/flagstock')) {
      console.warn('[db] DATABASE_URL not set or using placeholder — check .env');
    }
    const connectionString = url || 'postgresql://user:password@localhost:5432/flagstock';
    _pool = new Pool({ connectionString, max: 10 });
    _pool.on('error', (err: Error) => {
      console.error('[db] Pool error:', err.message);
    });
  }
  return _pool;
}

/** Proxy that binds all method calls to the lazily-created pool instance. */
const pool = new Proxy({} as PgPool, {
  get(_target, prop: string | symbol) {
    const instance = getPool();
    const val = (instance as any)[prop];
    if (typeof val === 'function') {
      return val.bind(instance);
    }
    return val;
  },
});

export default pool;
