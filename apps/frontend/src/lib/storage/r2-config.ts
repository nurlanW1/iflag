/**
 * Cloudflare R2 configuration (read from environment).
 *
 * Where to configure later:
 * ───────────────────────
 * • **Public preview / free downloads (browser-safe)**  
 *   Set `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` to your public bucket custom domain or public R2 dev URL
 *   (e.g. `https://preview.cdn.example.com` or `https://<bucket>.<accountid>.r2.cloudflarestorage.com` if bucket is public).
 *   No secret key belongs in `NEXT_PUBLIC_*`.
 *
 * • **Private pro bucket + presigned URLs (server-only)**  
 *   Configure on the **backend** or Vercel **server** environment (never `NEXT_PUBLIC_`):
 *   - `R2_ACCOUNT_ID`
 *   - `R2_BUCKET_NAME` (private bucket for pro masters)
 *   - `R2_ACCESS_KEY_ID`
 *   - `R2_SECRET_ACCESS_KEY`
 *   - Optional: `R2_ENDPOINT` (S3 API endpoint, e.g. `https://<accountid>.r2.cloudflarestorage.com`)
 *
 * Presigning should run only in server code (Express route or Next Route Handler) using the AWS S3 API
 * against R2; this frontend module deliberately does not read secret keys.
 */

/** Public base URL for objects that may be served without signing (previews, thumbs). */
export function getR2PublicAssetsBaseUrl(): string | null {
  const primary = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim();
  if (primary) {
    return primary.replace(/\/$/, '');
  }
  /** @deprecated Prefer NEXT_PUBLIC_R2_PUBLIC_BASE_URL — kept for older marketplace env. */
  const legacy = process.env.NEXT_PUBLIC_MARKETPLACE_PREVIEW_BASE_URL?.trim();
  if (legacy) {
    return legacy.replace(/\/$/, '');
  }
  return null;
}

/**
 * Bucket name for documentation / future server adapters (not used for signing in this package).
 * Server-only; safe to omit on client builds that only need public URLs.
 */
export function getR2PublicBucketName(): string | null {
  return process.env.NEXT_PUBLIC_R2_PUBLIC_BUCKET_NAME?.trim() || null;
}
