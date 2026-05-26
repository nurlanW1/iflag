/**
 * Normalize Postgres connection strings for Node `pg` (Neon TLS, pooler host).
 */

export function normalizeDatabaseUrlForPg(connectionString: string): string {
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

export function isNeonDatabaseHost(connectionString: string): boolean {
  try {
    return new URL(connectionString).hostname.toLowerCase().endsWith('.neon.tech');
  } catch {
    return false;
  }
}

/** Neon pooled endpoint (`ep-…-pooler.…neon.tech`) — better for scripts behind strict firewalls. */
export function toNeonPoolerUrl(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('.neon.tech') || host.includes('-pooler')) return connectionString;
    const [endpointId, ...rest] = host.split('.');
    if (!endpointId?.startsWith('ep-')) return connectionString;
    parsed.hostname = [`${endpointId}-pooler`, ...rest].join('.');
    return parsed.href;
  } catch {
    return connectionString;
  }
}

export function resolveScriptDatabaseUrl(): string {
  const raw =
    process.env.DATABASE_POOL_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    '';
  if (!raw) {
    throw new Error(
      'DATABASE_URL is required. For Neon, copy the “Pooled connection” string into DATABASE_URL or DATABASE_POOL_URL.',
    );
  }
  let url = normalizeDatabaseUrlForPg(raw);
  const usePooler = process.env.DATABASE_USE_POOLER?.trim().toLowerCase();
  if (usePooler !== 'false' && usePooler !== '0') {
    url = toNeonPoolerUrl(url);
  }
  return url;
}
