import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextProxy } from 'next/server';
import { jwtVerify } from 'jose';
import { getAccessCookieName } from '@/lib/auth/cookies';
import { getSafeInternalReturnPath } from '@/lib/auth/safe-redirect';
import { isClerkConfigured } from '@/lib/auth/clerk-env';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);
const isAuthPageRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

let clerkMissingProxyLogged = false;

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

const runClerkMiddleware = clerkMiddleware(async (auth, req) => {
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

/**
 * Without Clerk keys, `clerkMiddleware` throws on every request in production.
 * Degrade to public traffic + legacy admin cookie checks only; keep `/dashboard` off the app shell.
 */
async function proxyWithoutClerk(req: NextRequest): Promise<NextResponse> {
  if (
    !clerkMissingProxyLogged &&
    (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production')
  ) {
    clerkMissingProxyLogged = true;
    console.warn(
      '[flagswing] Clerk is not configured (set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY). Skipping Clerk middleware.'
    );
  }

  if (isDashboardRoute(req)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!(await hasAdminAccess(req))) {
      const login = new URL('/login', req.url);
      login.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

const proxy: NextProxy = async (req, event) => {
  if (!isClerkConfigured()) {
    return proxyWithoutClerk(req);
  }
  return runClerkMiddleware(req, event);
};

export default proxy;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
