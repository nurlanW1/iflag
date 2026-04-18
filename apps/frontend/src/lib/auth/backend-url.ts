/**
 * Server-side backend API base (includes `/api` prefix), e.g. http://localhost:4000/api
 * Prefer `API_URL` on Vercel so the value is not exposed to the browser; fall back to `NEXT_PUBLIC_API_URL`.
 */
export function getBackendApiBaseUrl(): string {
  const fromServer = process.env.API_URL?.trim();
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = fromServer || fromPublic;
  if (!base) {
    throw new Error(
      'Configure API_URL (server) or NEXT_PUBLIC_API_URL for authentication requests.'
    );
  }
  return base.replace(/\/$/, '');
}
