import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getAccessCookieName,
  getCookieBaseOptions,
  getRefreshCookieName,
} from '@/lib/auth/cookies';
import { getBackendApiBaseUrl } from '@/lib/auth/backend-url';

export async function POST() {
  const jar = await cookies();
  const access = jar.get(getAccessCookieName())?.value;
  const refresh = jar.get(getRefreshCookieName())?.value;
  const opts = getCookieBaseOptions();

  if (access && refresh) {
    try {
      await fetch(`${getBackendApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      /* still clear cookies locally */
    }
  }

  jar.set(getAccessCookieName(), '', { ...opts, maxAge: 0 });
  jar.set(getRefreshCookieName(), '', { ...opts, maxAge: 0 });

  return NextResponse.json({ ok: true });
}
