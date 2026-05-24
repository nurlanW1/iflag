import type { PublicProduct, PublicProductFile } from '@/lib/marketplace/product-mapper';
import {
  formatPricingMoney,
  productHasPaidTier,
  resolveCatalogDisplayPriceCents,
} from '@/lib/marketing/pricing-config';

export function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  return formatPricingMoney(cents, currency || 'USD');
}

/** Price label for catalog cards and PDP headers. */
export function formatProductListPrice(product: Pick<PublicProduct, 'priceCents' | 'currency' | 'files'>): string {
  const cents = resolveCatalogDisplayPriceCents(product.priceCents, productHasPaidTier(product));
  return formatPrice(cents, product.currency);
}

/** Remove duplicate file rows keyed twice (prefer first by sortOrder). */
export function dedupePublicProductFiles(files: PublicProductFile[]): PublicProductFile[] {
  const sorted = [...files].sort((a, b) => a.sortOrder - b.sortOrder);
  const seen = new Set<string>();
  const out: PublicProductFile[] = [];
  for (const f of sorted) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
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
