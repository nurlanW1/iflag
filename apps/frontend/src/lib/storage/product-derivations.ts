import type { ProFileKeyDescriptor } from '@/types/marketplace';
import type { ProductFile } from '@/types/marketplace';
import { buildPublicR2ObjectUrl } from './public-urls';

export function deriveProFileKeys(files: ProductFile[]): ProFileKeyDescriptor[] {
  return files
    .filter((f) => f.tier === 'pro')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f) => ({
      fileId: f.id,
      format: f.format,
      qualityLabel: f.qualityLabel,
      storageKey: f.storageKey,
    }));
}

/**
 * Prefer explicit `publicUrl` on the first preview_free file; else public R2 base + key.
 */
export function deriveFreeDownloadUrl(files: ProductFile[]): string | null {
  const previews = files
    .filter((f) => f.tier === 'preview_free')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const first = previews[0];
  if (!first) return null;
  if (first.publicUrl && first.publicUrl.trim() !== '') {
    return first.publicUrl;
  }
  return buildPublicR2ObjectUrl(first.storageKey);
}
