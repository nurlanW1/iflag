import { getR2PublicAssetsBaseUrl } from '@/lib/storage/r2-config';

/**
 * Public base URL for preview assets (delegates to R2 public config).
 * Prefer `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`; see `lib/storage/r2-config.ts`.
 */
export function getPublicPreviewBaseUrl(): string | null {
  return getR2PublicAssetsBaseUrl();
}
