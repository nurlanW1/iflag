/**
 * Next.js only loads `middleware.ts` at the app root — Clerk detects `clerkMiddleware()` via this entry.
 * App-specific guards (dashboard, auth redirects, `/admin` allow-list) live in `./src/proxy.ts`.
 *
 * `export const config` must be defined here — Next cannot parse it when re-exported from another file.
 */
import proxy from './src/proxy';

export default proxy;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
