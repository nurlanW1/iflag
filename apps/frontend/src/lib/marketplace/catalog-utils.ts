import type { PublicProduct, PublicProductFile } from '@/lib/marketplace/product-mapper';

export function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** Distinct format codes for badges, stable order */
export function collectFormatLabels(files: PublicProductFile[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const sorted = [...files].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const f of sorted) {
    const label = f.format.toUpperCase();
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}

export function isPaidCatalogProduct(p: PublicProduct): boolean {
  return p.priceCents > 0 || p.files.some((f) => f.tier === 'pro');
}
