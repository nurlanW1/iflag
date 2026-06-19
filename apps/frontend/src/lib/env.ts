/**
 * Type-safe environment variable access for the frontend.
 * Server-only vars (no NEXT_PUBLIC_ prefix) will throw in browser bundles — by design.
 */

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

// ─── Public (browser-safe) ────────────────────────────────────────────────────

export const env = {
  /** Base URL of the backend API, e.g. http://localhost:4000/api */
  apiUrl: optional('NEXT_PUBLIC_API_URL', 'http://localhost:4000/api').replace(/\/+$/, ''),

  /** Public site URL for canonical links and OG tags */
  siteUrl: optional('NEXT_PUBLIC_SITE_URL', 'https://flagswing.com').replace(/\/+$/, ''),

  /** Support / contact email shown in footer and legal pages */
  contactEmail: optional('NEXT_PUBLIC_CONTACT_EMAIL', 'nurlanrahmonqulov@gmail.com'),

  /** Clerk publishable key — NEXT_PUBLIC_* so it's safe in the browser */
  clerkPublishableKey: optional('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),

  /** Admin email for UI access checks */
  adminEmail: optional('NEXT_PUBLIC_ADMIN_EMAIL', ''),

  /** Comma-separated admin allow-list */
  adminEmailAllowlist: optional('NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST', ''),

  /** Cloudflare R2 public CDN base URL for preview images */
  r2PublicBaseUrl: optional('NEXT_PUBLIC_R2_PUBLIC_BASE_URL', '').replace(/\/+$/, ''),

  /** Paddle client-side token for Paddle.js checkout */
  paddleClientToken: optional('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN'),
} as const;

// ─── Server-only (Next.js Route Handlers / Server Components only) ───────────

export const serverEnv = {
  databaseUrl: () => required('DATABASE_URL'),
  clerkSecretKey: () => required('CLERK_SECRET_KEY'),
  internalAuthBridgeSecret: () => optional('INTERNAL_AUTH_BRIDGE_SECRET'),
  authJwtSecret: () => optional('AUTH_JWT_SECRET'),

  r2AccountId: () => optional('CLOUDFLARE_R2_ACCOUNT_ID'),
  r2AccessKeyId: () => optional('CLOUDFLARE_R2_ACCESS_KEY_ID'),
  r2SecretAccessKey: () => optional('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
  r2BucketName: () => optional('CLOUDFLARE_R2_BUCKET_NAME'),
  r2PublicUrl: () => optional('CLOUDFLARE_R2_PUBLIC_URL', '').replace(/\/+$/, ''),
  r2Endpoint: () => optional('CLOUDFLARE_R2_ENDPOINT'),
} as const;
