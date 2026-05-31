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
  assetGroupKey?: string | null;
  assetId?: string | null;
  fileId?: string | null;
  assetProductSlug?: string | null;
  countrySlug?: string | null;
  productId?: string;
  previewFile?: PublicProductFile | null;
  requiresEntitlement?: boolean;
  /** Denser sidebar + format rail for marketplace PDP */
  compactLayout?: boolean;
  /** PDP desktop: full-size offers + no height clamp (mobile dock stays compact). */
  roomyDesktopSidebar?: boolean;
  /** PDP desktop: narrower column + denser format/offer rails. */
  narrowDesktopSidebar?: boolean;
  /** When false, mobile/tablet keeps download UI in page flow (PDP below preview). */
  mobileBottomDock?: boolean;
  ownsProduct?: boolean;
  onAlreadyPurchased?: () => void;
  selectedId?: string | null;
  onSelectId?: (fileId: string) => void;
};

/** Neon / assets PDP — thin wrapper around unified stock download panel. */
export function NeonAssetDownloads(props: Props) {
  return <StockDownloadPanel headingId="fmt-heading-neon" {...props} />;
}
