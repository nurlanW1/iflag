import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBackendApiBaseUrl } from '@/lib/auth/backend-url';
import { applyAuthSessionCookies } from '@/lib/auth/session-cookies.server';

type LoginBody = { email?: string; password?: string };

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${getBackendApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }

  if (!backendRes.ok) {
    const errBody = (await backendRes.json().catch(() => ({}))) as { error?: string };
    return NextResponse.json(
      { error: errBody.error || 'Invalid email or password' },
      { status: backendRes.status === 401 ? 401 : backendRes.status }
    );
  }

  const data = (await backendRes.json()) as {
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

  /**
   * Tokens are also returned for the existing Axios client (localStorage).
   * HttpOnly cookies are the source of truth for middleware and server components.
   */
  return NextResponse.json({
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}
