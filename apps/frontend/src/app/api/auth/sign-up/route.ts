import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { backendUnreachableResponse, fetchBackendApi } from '@/lib/auth/backend-fetch.server';
import { resolveBackendApiBase } from '@/lib/auth/backend-url';
import { applyAuthSessionCookies } from '@/lib/auth/session-cookies.server';

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

  const apiBase = resolveBackendApiBase();
  if (!apiBase.ok) {
    return NextResponse.json(
      { error: apiBase.error, code: apiBase.code },
      { status: 503 },
    );
  }

  try {
    const regRes = await fetchBackendApi(apiBase.baseUrl, '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: full_name || undefined }),
    });

    if (!regRes.ok) {
      const errBody = (await regRes.json().catch(() => ({}))) as { error?: string };
      return NextResponse.json(
        { error: errBody.error || 'Registration failed' },
        { status: regRes.status >= 400 && regRes.status < 600 ? regRes.status : 400 },
      );
    }

    const loginRes = await fetchBackendApi(apiBase.baseUrl, '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      return NextResponse.json(
        { error: 'Account created. Please sign in with your new credentials.' },
        { status: 201 },
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

    const jar = await cookies();
    applyAuthSessionCookies(jar, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return NextResponse.json(
      {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[auth/sign-up] backend fetch failed:', err);
    return backendUnreachableResponse(apiBase.baseUrl, '/auth/register', err, 503);
  }
}
