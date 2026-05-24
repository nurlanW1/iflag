/**
 * Backend API base for the frontend (normalized to exactly one `/api` suffix).
 * Examples (equivalent after normalize):
 *   https://your-service.up.railway.app
 *   https://your-service.up.railway.app/api
 *
 * All server proxies and browser clients use `NEXT_PUBLIC_API_URL` only.
 * Legacy `API_URL` is ignored so stale Vercel backend values cannot override Railway.
 */

const LOCAL_DEV_DEFAULT = 'http://localhost:4000/api';

/** Retired Vercel API host — must not be used in production. */
const DEPRECATED_BACKEND_HOST = 'iflag-backend.vercel.app';

const PROBE_TIMEOUT_MS = 6_000;

export type BackendApiResolution =
  | { ok: true; baseUrl: string }
  | { ok: false; error: string; code: 'API_URL_MISSING' | 'API_URL_DEPRECATED' };

export type BackendProbeResult = {
  url: string;
  ok: boolean;
  status?: number;
};

let loggedLegacyApiUrlWarning = false;
let loggedResolvedHost: string | null = null;

/** Prepend https:// (or http:// for localhost) when env omits the scheme. */
function ensureUrlScheme(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  const host = trimmed.split('/')[0]?.toLowerCase() ?? '';
  if (
    host === 'localhost' ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('[::1]')
  ) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Normalize env value:
 * - ensure https:// (or http:// for localhost)
 * - trim + strip trailing slashes
 * - collapse `/api/api`
 * - append `/api` when missing
 */
export function normalizeBackendApiBase(raw: string): string {
  let url = ensureUrlScheme(raw).replace(/\/+$/, '');
  if (!url) return LOCAL_DEV_DEFAULT;

  while (/\/api\/api$/i.test(url)) {
    url = url.replace(/\/api\/api$/i, '/api');
  }

  if (!/\/api$/i.test(url)) {
    url = `${url}/api`;
  }

  return url;
}

/** Railway service origin without the `/api` prefix. */
export function getBackendOriginFromApiBase(apiBaseUrl: string): string {
  try {
    const u = new URL(ensureUrlScheme(apiBaseUrl));
    u.pathname = '/';
    u.search = '';
    u.hash = '';
    return u.origin;
  } catch {
    return ensureUrlScheme(apiBaseUrl).replace(/\/api\/?$/i, '');
  }
}

/** GET /health on the service root (not under /api). */
export function getBackendHealthUrl(apiBaseUrl: string): string {
  return `${getBackendOriginFromApiBase(apiBaseUrl)}/health`;
}

/** GET / on the service root (API index JSON). */
export function getBackendServiceRootUrl(apiBaseUrl: string): string {
  return `${getBackendOriginFromApiBase(apiBaseUrl)}/`;
}

/** Normalized API prefix URL (ends with /api). */
export function getBackendApiPrefixUrl(apiBaseUrl: string): string {
  return normalizeBackendApiBase(apiBaseUrl);
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
    return (
      host === DEPRECATED_BACKEND_HOST ||
      (host.endsWith('.vercel.app') && host.includes('iflag-backend'))
    );
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
        'NEXT_PUBLIC_API_URL is not set. Point it at your Railway backend, e.g. https://your-service.up.railway.app/api (https:// is required if omitted from env).',
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
  return `${normalizeBackendApiBase(baseUrl).replace(/\/+$/, '')}${segment}`;
}

async function probeUrl(url: string): Promise<BackendProbeResult> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return { url, ok: res.ok, status: res.status };
  } catch {
    return { url, ok: false };
  }
}

/** Probe /health, service /, and /api prefix — used to enrich unreachable errors. */
export async function probeBackendConnectivity(apiBaseUrl: string): Promise<BackendProbeResult[]> {
  const base = normalizeBackendApiBase(apiBaseUrl);
  return Promise.all([
    probeUrl(getBackendHealthUrl(base)),
    probeUrl(getBackendServiceRootUrl(base)),
    probeUrl(getBackendApiPrefixUrl(base)),
  ]);
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    if (cause.name === 'AbortError' || cause.message.includes('aborted')) {
      return 'Request timed out.';
    }
    return cause.message;
  }
  return 'Network error.';
}

function formatProbeSummary(probes: BackendProbeResult[]): string {
  return probes
    .map((p) => {
      if (p.ok) return `${p.url} → OK (${p.status ?? '?'})`;
      return p.status ? `${p.url} → HTTP ${p.status}` : `${p.url} → unreachable`;
    })
    .join('; ');
}

export function formatBackendUnreachableError(opts: {
  baseUrl: string;
  attemptedUrl: string;
  cause?: unknown;
  probes?: BackendProbeResult[];
}): string {
  const normalizedBase = normalizeBackendApiBase(opts.baseUrl);
  const lines = [
    `Cannot reach the backend API at ${opts.attemptedUrl}.`,
    `NEXT_PUBLIC_API_URL resolves to ${normalizedBase} (https:// is added automatically when omitted).`,
    describeCause(opts.cause),
  ];

  if (opts.probes?.length) {
    lines.push(`Connectivity checks: ${formatProbeSummary(opts.probes)}.`);
  } else {
    lines.push(
      `Expected Railway routes: ${getBackendHealthUrl(normalizedBase)}, ${getBackendApiPrefixUrl(normalizedBase)}, ${joinBackendApiPath(normalizedBase, '/auth/bridge/clerk-session')}.`,
    );
  }

  lines.push(
    'Ensure the Railway service has a public domain, CORS allows https://flagswing.com and https://www.flagswing.com, and remove any stale iflag-backend.vercel.app URL from Vercel env.',
  );

  return lines.join(' ');
}

/** @deprecated Prefer formatBackendUnreachableError / fetchBackendApi for exact URLs. */
export const BACKEND_UNREACHABLE_MESSAGE =
  'Cannot reach the backend API. Set NEXT_PUBLIC_API_URL to your Railway backend (with or without /api).';

/** @throws if NEXT_PUBLIC_API_URL is unset in production — prefer resolveBackendApiBase for Route Handlers. */
export function getBackendApiBaseUrl(): string {
  const r = resolveBackendApiBase();
  if (!r.ok) throw new Error(r.error);
  return r.baseUrl;
}
