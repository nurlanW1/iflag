/**
 * Backend API base for the frontend (includes exactly one `/api` suffix).
 * Example: https://your-service.up.railway.app/api
 *
 * All server proxies and browser clients use `NEXT_PUBLIC_API_URL` only.
 * Legacy `API_URL` is ignored so stale Vercel backend values cannot override Railway.
 */

const LOCAL_DEV_DEFAULT = 'http://localhost:4000/api';

/** Retired Vercel API host — must not be used in production. */
const DEPRECATED_BACKEND_HOST = 'iflag-backend.vercel.app';

export type BackendApiResolution =
  | { ok: true; baseUrl: string }
  | { ok: false; error: string; code: 'API_URL_MISSING' | 'API_URL_DEPRECATED' };

let loggedLegacyApiUrlWarning = false;
let loggedResolvedHost: string | null = null;

/** Normalize env value: trim, single trailing `/api`, collapse `/api/api`. */
export function normalizeBackendApiBase(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!url) return LOCAL_DEV_DEFAULT;

  while (/\/api\/api$/i.test(url)) {
    url = url.replace(/\/api\/api$/i, '/api');
  }

  if (!/\/api$/i.test(url)) {
    url = `${url}/api`;
  }

  return url;
}

/** Hostname only — safe for logs (no path, credentials, or query). */
export function getBackendApiHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return '(invalid-url)';
  }
}

function isDeprecatedBackendHost(baseUrl: string): boolean {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    return host === DEPRECATED_BACKEND_HOST || host.endsWith('.vercel.app') && host.includes('iflag-backend');
  } catch {
    return false;
  }
}

function warnLegacyApiUrlIgnored(): void {
  if (loggedLegacyApiUrlWarning) return;
  const legacy = process.env.API_URL?.trim();
  if (!legacy) return;
  loggedLegacyApiUrlWarning = true;
  try {
    const host = new URL(legacy.replace(/\/+$/, '')).hostname;
    console.warn(
      `[flagswing] API_URL (${host}) is ignored — frontend uses NEXT_PUBLIC_API_URL only.`,
    );
  } catch {
    console.warn('[flagswing] API_URL is ignored — frontend uses NEXT_PUBLIC_API_URL only.');
  }
}

/** Log resolved backend host once per process (no secrets). */
export function logBackendApiHostOnce(baseUrl: string, context: string): void {
  const host = getBackendApiHost(baseUrl);
  if (loggedResolvedHost === host) return;
  loggedResolvedHost = host;
  console.info(`[flagswing] ${context} backend host: ${host}`);
}

/** Client-safe base URL (browser bundles). */
export function getClientBackendApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return LOCAL_DEV_DEFAULT;
  return normalizeBackendApiBase(raw);
}

/** Use in Route Handlers / server code when you need a clear 503 instead of throwing. */
export function resolveBackendApiBase(): BackendApiResolution {
  warnLegacyApiUrlIgnored();

  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'development') {
      return { ok: true, baseUrl: LOCAL_DEV_DEFAULT };
    }
    return {
      ok: false,
      code: 'API_URL_MISSING',
      error:
        'NEXT_PUBLIC_API_URL is not set. Point it at your Railway backend including /api (e.g. https://your-service.up.railway.app/api).',
    };
  }

  const baseUrl = normalizeBackendApiBase(raw);

  if (process.env.NODE_ENV === 'production' && isDeprecatedBackendHost(baseUrl)) {
    return {
      ok: false,
      code: 'API_URL_DEPRECATED',
      error: `NEXT_PUBLIC_API_URL points to deprecated host ${getBackendApiHost(baseUrl)}. Update Vercel to your Railway backend URL.`,
    };
  }

  return { ok: true, baseUrl };
}

/** Join normalized base with a route segment (base already ends with /api). */
export function joinBackendApiPath(baseUrl: string, path: string): string {
  const segment = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/+$/, '')}${segment}`;
}

export const BACKEND_UNREACHABLE_MESSAGE =
  'Cannot reach the backend API. Check NEXT_PUBLIC_API_URL points to your Railway server (…/api), CORS allows this site, and /api routes exist.';

/** @throws if NEXT_PUBLIC_API_URL is unset in production — prefer resolveBackendApiBase for Route Handlers. */
export function getBackendApiBaseUrl(): string {
  const r = resolveBackendApiBase();
  if (!r.ok) throw new Error(r.error);
  return r.baseUrl;
}
