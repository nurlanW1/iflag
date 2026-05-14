/**
 * Server-side backend API base (includes `/api` prefix), e.g. http://localhost:4000/api
 * Prefer `API_URL` on Vercel so the value is not exposed to the browser; fall back to `NEXT_PUBLIC_API_URL`.
 */

export type BackendApiResolution =
  | { ok: true; baseUrl: string }
  | { ok: false; error: string; code: 'API_URL_MISSING' };

/** Use in Route Handlers / server code when you need a clear 503 instead of throwing. */
export function resolveBackendApiBase(): BackendApiResolution {
  const fromServer = process.env.API_URL?.trim();
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = fromServer || fromPublic;
  if (!base) {
    return {
      ok: false,
      code: 'API_URL_MISSING',
      error:
        'Backend API URL is not set. Add API_URL (recommended on Vercel, e.g. https://api.yourdomain.com/api) or NEXT_PUBLIC_API_URL. Production must not use localhost.',
    };
  }
  return { ok: true, baseUrl: base.replace(/\/$/, '') };
}

export const BACKEND_UNREACHABLE_MESSAGE =
  'Cannot reach the backend API. Check API_URL points to your running server (HTTPS in production), firewall allows Vercel outbound calls, and /api routes exist.';

/** @throws if URL env vars are unset — prefer resolveBackendApiBase for Route Handlers. */
export function getBackendApiBaseUrl(): string {
  const r = resolveBackendApiBase();
  if (!r.ok) throw new Error(r.error);
  return r.baseUrl;
}
