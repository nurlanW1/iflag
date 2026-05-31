'use client';

import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import type { CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import { StockDownloadPanel } from '@/components/marketplace/StockDownloadPanel';

type Props = {
  productId: string;
  productSlug: string;
  currency: string;
  paidCatalog: boolean;
  files: PublicProductFile[];
  previewFile: PublicProductFile | null;
  licenseSummary?: string | null;
  cartProduct: CartProductRef;
  assetLabel?: string;
};

/** Catalog `/flags/*` PDP — unified with assets/gallery download UI. */
export function PremiumCatalogCommerce({
  productId,
  productSlug,
  currency: _currency,
  paidCatalog,
  files,
  previewFile,
  licenseSummary,
  cartProduct,
  assetLabel,
}: Props) {
  void _currency;

  return (
    <StockDownloadPanel
      headingId="fmt-heading-catalog"
      files={files}
      cartProduct={cartProduct}
      assetLabel={assetLabel}
      licenseSummary={licenseSummary}
      productId={productId}
      previewFile={previewFile}
      requiresEntitlement={paidCatalog}
    />
  );
}
