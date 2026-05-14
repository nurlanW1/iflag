import {
  ACCESS_MAX_AGE_SECONDS,
  REFRESH_MAX_AGE_SECONDS,
  getAccessCookieName,
  getCookieBaseOptions,
  getRefreshCookieName,
} from '@/lib/auth/cookies';

/** Sets HttpOnly auth cookies (same contract as `/api/auth/sign-in`). */
export function applyAuthSessionCookies(
  jar: {
    set: (
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'lax' | 'strict' | 'none';
        path?: string;
        maxAge?: number;
      }
    ) => void;
  },
  tokens: { accessToken: string; refreshToken: string }
): void {
  const cookieOpts = getCookieBaseOptions();
  jar.set(getAccessCookieName(), tokens.accessToken, {
    ...cookieOpts,
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  jar.set(getRefreshCookieName(), tokens.refreshToken, {
    ...cookieOpts,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}
