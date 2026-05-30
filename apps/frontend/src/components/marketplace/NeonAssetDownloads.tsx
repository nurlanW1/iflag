'use client';

import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import type { CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import { StockDownloadPanel } from '@/components/marketplace/StockDownloadPanel';

type Props = {
  files: PublicProductFile[];
  licenseSummary?: string | null;
  cartProduct: CartProductRef;
  assetLabel?: string;
  productSlug?: string;
  productId?: string;
  previewFile?: PublicProductFile | null;
  requiresEntitlement?: boolean;
  /** Denser sidebar + format rail for marketplace PDP */
  compactLayout?: boolean;
  selectedId?: string | null;
  onSelectId?: (fileId: string) => void;
};

/** Neon / assets PDP — thin wrapper around unified stock download panel. */
export function NeonAssetDownloads(props: Props) {
  return <StockDownloadPanel headingId="fmt-heading-neon" {...props} />;
}
