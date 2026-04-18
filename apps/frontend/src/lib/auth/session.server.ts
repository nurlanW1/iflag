import { cookies } from 'next/headers';
import {
  getAccessCookieName,
  getRefreshCookieName,
} from '@/lib/auth/cookies';
import { getBackendApiBaseUrl } from '@/lib/auth/backend-url';

export type SessionUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  email_verified: boolean;
};

export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  const access = (await cookies()).get(getAccessCookieName())?.value;
  if (!access) {
    return null;
  }
  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as SessionUser;
  } catch {
    return null;
  }
}

/** Used by sign-out route to forward refresh token body. */
export async function getRefreshTokenFromCookies(): Promise<string | null> {
  return (await cookies()).get(getRefreshCookieName())?.value ?? null;
}

export async function getAccessTokenFromCookies(): Promise<string | null> {
  return (await cookies()).get(getAccessCookieName())?.value ?? null;
}
