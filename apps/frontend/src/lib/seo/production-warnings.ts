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

  if (!process.env.AUTH_JWT_SECRET?.trim()) {
    console.warn(
      '[flagswing] Production: AUTH_JWT_SECRET is not set. Middleware cannot verify JWT signatures; dashboard/admin protection is weakened. Set AUTH_JWT_SECRET to match your auth issuer.'
    );
  }

  if (!process.env.NEXT_PUBLIC_API_URL?.trim() && !process.env.API_URL?.trim()) {
    console.warn(
      '[flagswing] Production: NEXT_PUBLIC_API_URL / API_URL unset. Session and API calls may fail; configure your backend base URL.'
    );
  }

  if (!process.env.LEMONSQUEEZY_API_KEY?.trim()) {
    console.warn(
      '[flagswing] Production: LEMONSQUEEZY_API_KEY unset. Checkout and webhooks will not work until Lemon Squeezy is configured.'
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
