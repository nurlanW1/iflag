import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import type { ProductFileTier } from '@/types/marketplace/product-file';

/** Parse sizes produced by gallery DB (`formatFileSize`) or disk listing. */
export function parseGalleryHumanSizeToBytes(label: string | undefined | null): number | null {
  const raw = label?.trim() ?? '';
  if (!raw || /^unknown$/i.test(raw)) return null;
  const m = raw.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
  if (!m) return null;
  const n = Number.parseFloat(m[1] ?? '');
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = String(m[2] ?? 'B').toUpperCase();
  if (unit === 'B') return Math.round(n);
  if (unit === 'KB') return Math.round(n * 1024);
  if (unit === 'MB') return Math.round(n * 1024 * 1024);
  if (unit === 'GB') return Math.round(n * 1024 * 1024 * 1024);
  return null;
}

export function galleryFormatRowToPublicFile(row: {
  id: string;
  format: string;
  file: string;
  size: string;
}): PublicProductFile {
  const bytes = parseGalleryHumanSizeToBytes(row.size);
  return {
    id: row.id,
    tier: 'pro' satisfies ProductFileTier,
    format: row.format,
    qualityLabel: '',
    fileName: row.file,
    mimeType: 'application/octet-stream',
    bytes,
    sortOrder: 0,
    downloadUrl: null,
  };
}
