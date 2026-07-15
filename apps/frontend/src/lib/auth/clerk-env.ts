/**
 * Publishable key: must match Clerk dashboard / Vercel. Prefer
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Next inlines it for the browser). Some setups only set
 * `CLERK_PUBLISHABLE_KEY`; `next.config.mjs` also maps that into NEXT_PUBLIC at build time.
 */
export function getClerkPublishableKey(): string {
  const key = (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
    ''
  );
  const allowLiveClerkInLocal =
    process.env.NEXT_PUBLIC_ALLOW_LIVE_CLERK_LOCAL === 'true' ||
    process.env.ALLOW_LIVE_CLERK_LOCAL === 'true';

  if (process.env.NODE_ENV !== 'production' && key.startsWith('pk_live_') && !allowLiveClerkInLocal) {
    return '';
  }

  return key;
}

/**
 * Clerk requires both keys in production; `clerkMiddleware` throws if either is missing
 * when keyless mode is unavailable (non-development).
 */
export function isClerkConfigured(): boolean {
  return Boolean(getClerkPublishableKey() && process.env.CLERK_SECRET_KEY?.trim());
}
