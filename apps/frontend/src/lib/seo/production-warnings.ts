import { isClerkConfigured } from '@/lib/auth/clerk-env';
import { isAdminAllowlistConfigured } from '@/lib/auth/admin-email';
import {
  getBackendApiHost,
  logBackendApiHostOnce,
  normalizeBackendApiBase,
} from '@/lib/auth/backend-url';

const DEPRECATED_BACKEND_HOST = 'iflag-backend.vercel.app';

/**
 * Server-only startup checks for production deployments.
 * Logs warnings (does not throw) so builds succeed while surfacing misconfiguration.
 */
export function logProductionDeploymentWarnings(): void {
  if (process.env.VERCEL_ENV !== 'production') {
    return;
  }

  if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    console.warn(
      '[flagswing] Production: NEXT_PUBLIC_SITE_URL is not set. Canonical URLs and Open Graph may rely on VERCEL_URL; set an explicit https://… origin for stable SEO.'
    );
  }

  if (isClerkConfigured() && !isAdminAllowlistConfigured()) {
    console.warn(
      '[flagswing] Production: Admin allow-list is empty. Set ADMIN_EMAIL (optional comma-separated); otherwise the built-in fallback may apply.'
    );
  }

  if (!isClerkConfigured()) {
    console.warn(
      '[flagswing] Production: Clerk keys missing. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) and CLERK_SECRET_KEY in Vercel, then redeploy.'
    );
  }

  if (!process.env.AUTH_JWT_SECRET?.trim()) {
    console.warn(
      '[flagswing] Production: AUTH_JWT_SECRET is not set. Middleware cannot verify JWT signatures; dashboard/admin protection is weakened. Set AUTH_JWT_SECRET to match your auth issuer.'
    );
  }

  const publicApi = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!publicApi) {
    console.warn(
      '[flagswing] Production: NEXT_PUBLIC_API_URL is unset. Set it to your Railway backend (…/api) for auth bridge, billing, and catalog calls.'
    );
  } else {
    const base = normalizeBackendApiBase(publicApi);
    logBackendApiHostOnce(base, 'production');
    const host = getBackendApiHost(base);
    if (
      host === DEPRECATED_BACKEND_HOST ||
      (host.endsWith('.vercel.app') && host.includes('iflag-backend'))
    ) {
      console.warn(
        `[flagswing] Production: NEXT_PUBLIC_API_URL points to deprecated host ${host}. Update Vercel to your Railway backend URL.`,
      );
    }
  }

  if (process.env.API_URL?.trim()) {
    console.warn(
      '[flagswing] Production: API_URL is set but ignored. Remove the stale value from Vercel and use NEXT_PUBLIC_API_URL for Railway.',
    );
  }

  const hasPublicPreviewBase =
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_MARKETPLACE_PREVIEW_BASE_URL?.trim();
  if (!hasPublicPreviewBase) {
    console.warn(
      '[flagswing] Production: NEXT_PUBLIC_R2_PUBLIC_BASE_URL is unset. Preview assets that use storage keys without absolute publicUrl may not resolve; set your public bucket or CDN origin.'
    );
  }
}
