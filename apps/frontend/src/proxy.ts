import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getAccessCookieName } from '@/lib/auth/cookies';
import { getSafeInternalReturnPath } from '@/lib/auth/safe-redirect';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);
const isAuthPageRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

async function hasValidAccessToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(getAccessCookieName())?.value;
  if (!token) return false;

  const secret = process.env.AUTH_JWT_SECRET?.trim();
  if (!secret) {
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

export default clerkMiddleware(async (auth, req) => {
  if (isAuthPageRoute(req)) {
    const { userId } = await auth();
    if (userId) {
      const next =
        getSafeInternalReturnPath(req.nextUrl.searchParams.get('redirect_url')) ?? '/dashboard';
      return NextResponse.redirect(new URL(next, req.url));
    }
  }

  if (isDashboardRoute(req)) {
    await auth.protect();
  }

  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!(await hasAdminAccess(req))) {
      const login = new URL('/login', req.url);
      login.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(login);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
