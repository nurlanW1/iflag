import type { PublicProductFile } from '@/lib/marketplace/product-mapper';

/** Fixed stock slots shown on PDP (missing = dimmed/disabled UI). JPG matches jpeg in data. */
export const STOCK_FORMAT_ORDER = ['EPS', 'SVG', 'PNG', 'JPG'] as const;
export type StockFormatSlot = (typeof STOCK_FORMAT_ORDER)[number];

export function normalizeStockFormat(format: string): StockFormatSlot | string {
  const k = format.trim().replace(/^\./, '').toUpperCase();
  if (k === 'JPEG') return 'JPG';
  return k;
}

export function fileAtStockSlot(files: PublicProductFile[], slot: StockFormatSlot): PublicProductFile | null {
  const keys = slot === 'JPG' ? new Set(['JPG', 'JPEG']) : new Set<string>([slot]);
  for (const f of files) {
    const n = normalizeStockFormat(f.format);
    if (keys.has(n)) return f;
  }
  return null;
}

function stockSlotMatchedFileIds(files: PublicProductFile[]): Set<string> {
  const ids = new Set<string>();
  for (const slot of STOCK_FORMAT_ORDER) {
    const pf = fileAtStockSlot(files, slot);
    if (pf) ids.add(pf.id);
  }
  return ids;
}

/** Files whose format doesn’t match the four canonical slots (rare edge case). */
export function extraStockFilesBeyondCanonical(files: PublicProductFile[]): PublicProductFile[] {
  const matched = stockSlotMatchedFileIds(files);
  return [...files].filter((f) => !matched.has(f.id));
}

export function countAvailableCanonicalSlots(files: PublicProductFile[]): number {
  return STOCK_FORMAT_ORDER.reduce((acc, slot) => (fileAtStockSlot(files, slot) ? acc + 1 : acc), 0);
}

/** Prefer EPS → SVG → PNG → JPG first available id; otherwise first unmatched file */
export function firstSelectableStockFileId(files: PublicProductFile[]): string | null {
  for (const slot of STOCK_FORMAT_ORDER) {
    const f = fileAtStockSlot(files, slot);
    if (f) return f.id;
  }
  return files[0]?.id ?? null;
}
