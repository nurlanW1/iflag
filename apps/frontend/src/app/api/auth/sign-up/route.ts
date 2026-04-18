import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ACCESS_MAX_AGE_SECONDS,
  REFRESH_MAX_AGE_SECONDS,
  getAccessCookieName,
  getCookieBaseOptions,
  getRefreshCookieName,
} from '@/lib/auth/cookies';
import { getBackendApiBaseUrl } from '@/lib/auth/backend-url';

type RegisterBody = { email?: string; password?: string; full_name?: string };

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : undefined;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  let regRes: Response;
  try {
    regRes = await fetch(`${getBackendApiBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: full_name || undefined }),
    });
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }

  if (!regRes.ok) {
    const errBody = (await regRes.json().catch(() => ({}))) as { error?: string };
    return NextResponse.json(
      { error: errBody.error || 'Registration failed' },
      { status: regRes.status >= 400 && regRes.status < 600 ? regRes.status : 400 }
    );
  }

  let loginRes: Response;
  try {
    loginRes = await fetch(`${getBackendApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json(
      { error: 'Account created but sign-in failed. Try logging in.' },
      { status: 503 }
    );
  }

  if (!loginRes.ok) {
    return NextResponse.json(
      { error: 'Account created. Please sign in with your new credentials.' },
      { status: 201 }
    );
  }

  const data = (await loginRes.json()) as {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      full_name: string | null;
      role: 'user' | 'admin';
      email_verified: boolean;
    };
  };

  const cookieOpts = getCookieBaseOptions();
  const jar = await cookies();
  jar.set(getAccessCookieName(), data.accessToken, {
    ...cookieOpts,
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  jar.set(getRefreshCookieName(), data.refreshToken, {
    ...cookieOpts,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });

  return NextResponse.json(
    {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
    { status: 201 }
  );
}
