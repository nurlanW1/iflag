/**
 * Canonical same-origin admin upload endpoint for the Next.js app.
 * Implementation lives in `flag-files/upload` (Blob + Neon); this route avoids
 * cross-origin/API-base URL mistakes by exposing `/api/admin/upload` on the app origin.
 */
export const runtime = 'nodejs';
export const maxDuration = 120;

export { POST } from '../flag-files/upload/route';
