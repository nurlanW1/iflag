/**
 * HttpOnly cookie names for auth. Override via env in production if needed.
 */
export function getAccessCookieName(): string {
  return process.env.AUTH_COOKIE_ACCESS?.trim() || 'fs_access';
}

export function getRefreshCookieName(): string {
  return process.env.AUTH_COOKIE_REFRESH?.trim() || 'fs_refresh';
}

export function getCookieBaseOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

/** Access token TTL should match backend JWT (default 15m). */
export const ACCESS_MAX_AGE_SECONDS = (() => {
  const raw = process.env.AUTH_ACCESS_MAX_AGE_SECONDS;
  if (raw && /^\d+$/.test(raw)) return parseInt(raw, 10);
  return 15 * 60;
})();

/** Refresh cookie — align with backend refresh lifetime (default 30d). */
export const REFRESH_MAX_AGE_SECONDS = (() => {
  const raw = process.env.AUTH_REFRESH_MAX_AGE_SECONDS;
  if (raw && /^\d+$/.test(raw)) return parseInt(raw, 10);
  return 30 * 24 * 60 * 60;
})();
