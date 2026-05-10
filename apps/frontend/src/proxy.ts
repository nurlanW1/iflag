import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Required so Route Handlers (`currentUser()`, `auth()`) see Clerk session cookies.
 * Without this, `/api/admin/*` returns 401 "Not signed in" even when the browser is signed in.
 *
 * Next.js 16+: this file is named `proxy.ts` (≤15: `middleware.ts`, same contents).
 * By default all routes stay public; admin gates live in Route Handlers / UI.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
