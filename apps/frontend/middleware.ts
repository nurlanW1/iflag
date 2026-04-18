import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getAccessCookieName } from '@/lib/auth/cookies';

async function hasValidAccessToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(getAccessCookieName())?.value;
  if (!token) return false;

  const secret = process.env.AUTH_JWT_SECRET?.trim();
  if (!secret) {
    /** Without AUTH_JWT_SECRET, fall back to non-empty token (validated again in RSC). */
    return token.length > 20;
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return true;
  } catch {
    return false;
  }
}

type JwtPayload = { role?: string };

/**
 * `/admin` requires a signed JWT with `role: "admin"` when AUTH_JWT_SECRET is set.
 * Without the secret (local dev), any long access cookie is treated as authenticated — tighten before public deploy.
 */
async function hasAdminAccess(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(getAccessCookieName())?.value;
  if (!token) return false;

  const secret = process.env.AUTH_JWT_SECRET?.trim();
  if (!secret) {
    return token.length > 20;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return (payload as JwtPayload).role === 'admin';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/dashboard')) {
    if (!(await hasValidAccessToken(request))) {
      const login = new URL('/login', request.url);
      login.searchParams.set(
        'callbackUrl',
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (path.startsWith('/admin')) {
    if (!(await hasAdminAccess(request))) {
      const login = new URL('/login', request.url);
      login.searchParams.set(
        'callbackUrl',
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
