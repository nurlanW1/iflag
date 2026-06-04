import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import type { Pool as PgPool } from 'pg';
import ws from 'ws';

/**
 * Server-only Postgres pool (Neon DATABASE_URL).
 * Uses @neondatabase/serverless (WebSocket) for compatibility with Neon's pooler.
 * Typed as pg.Pool for compatibility with existing codebase.
 * Never import from client components.
 */

// Enable WebSocket for serverless/Node.js environments
neonConfig.webSocketConstructor = ws;

let pool: NeonPool | undefined;

export function getDb(): PgPool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('[db] DATABASE_URL is not configured');
  }
  if (!pool) {
    pool = new NeonPool({ connectionString: url });
  }
  return pool as unknown as PgPool;
}
