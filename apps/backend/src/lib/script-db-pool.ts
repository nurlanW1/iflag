/**
 * Postgres pool for one-off CLI scripts (import:r2, backfill:*).
 *
 * On Neon, uses the serverless driver over WebSockets (port 443) when TCP :5432
 * is blocked — common on Windows home networks and corporate firewalls.
 */

import type { Pool } from 'pg';
import {
  isNeonDatabaseHost,
  normalizeDatabaseUrlForPg,
  resolveScriptDatabaseUrl,
} from './database-url.js';

function shouldUseNeonServerless(connectionString: string): boolean {
  const flag = process.env.DATABASE_USE_NEON_SERVERLESS?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') return false;
  if (flag === 'true' || flag === '1') return true;
  return isNeonDatabaseHost(connectionString);
}

export type ScriptPoolOptions = {
  connectionString?: string;
  max?: number;
};

export async function createScriptPool(opts: ScriptPoolOptions = {}): Promise<Pool> {
  const url = normalizeDatabaseUrlForPg(opts.connectionString ?? resolveScriptDatabaseUrl());
  const max = opts.max ?? 4;

  if (shouldUseNeonServerless(url)) {
    const { Pool: NeonPool, neonConfig } = await import('@neondatabase/serverless');
    const { default: ws } = await import('ws');
    neonConfig.webSocketConstructor = ws;
    console.log('[db] Using Neon serverless driver (WebSocket) for script connection');
    return new NeonPool({
      connectionString: url,
      max,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 45_000,
    }) as unknown as Pool;
  }

  const { default: pg } = await import('pg');
  return new pg.Pool({
    connectionString: url,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
  });
}

export async function verifyScriptDbConnection(pool: Pool, attempts = 5): Promise<void> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      last = err;
      const delayMs = 1500 * (i + 1);
      console.warn(`[db] connect attempt ${i + 1}/${attempts} failed — retry in ${delayMs}ms`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const code =
    last && typeof last === 'object' && 'code' in last
      ? String((last as { code?: string }).code)
      : '';
  const hint =
    code === 'ETIMEDOUT' || code === 'ECONNREFUSED'
      ? '\nHint: On Neon, ensure DATABASE_URL is set. Scripts auto-use the serverless driver on *.neon.tech. ' +
        'If TCP still fails, set DATABASE_USE_NEON_SERVERLESS=true or use the pooled connection string from the Neon dashboard.'
      : '';
  const msg = last instanceof Error ? last.message : String(last);
  throw new Error(`Database connection failed after ${attempts} attempts: ${msg}${hint}`);
}
