'use client';

import { useMemo } from 'react';
import type { CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import { StockDownloadPanel } from '@/components/marketplace/StockDownloadPanel';
import { galleryFormatRowToPublicFile } from '@/lib/marketplace/gallery-format-files';

export type GalleryCountryFormat = {
  id: string;
  format: string;
  file: string;
  size: string;
};

type Props = {
  formats: GalleryCountryFormat[];
  selectedFormatId: string | null;
  onSelectFormatId: (fileId: string) => void;
  onDownload: () => void;
  downloadBusy: boolean;
  downloadButtonLabel: string;
  licenseSummary?: string | null;
  cartProduct: CartProductRef;
  assetLabel?: string;
  productSlug?: string;
  /** Format needs subscription or one-time purchase. */
  formatRequiresEntitlement?: boolean;
  /** Owner / staff bypass — show download instead of purchase offers. */
  canDirectDownload?: boolean;
};

export function GalleryCountryDownloadsPanel({
  formats,
  selectedFormatId,
  onSelectFormatId,
  onDownload,
  downloadBusy,
  downloadButtonLabel,
  licenseSummary,
  cartProduct,
  assetLabel,
  productSlug,
  formatRequiresEntitlement = false,
  canDirectDownload = false,
}: Props) {
  const files = useMemo(() => formats.map(galleryFormatRowToPublicFile), [formats]);

  return (
    <StockDownloadPanel
      headingId="fmt-heading-gallery-country"
      files={files}
      cartProduct={cartProduct}
      assetLabel={assetLabel}
      licenseSummary={licenseSummary}
      selectedId={selectedFormatId}
      onSelectId={onSelectFormatId}
      requiresEntitlement={formatRequiresEntitlement}
      onDirectDownload={canDirectDownload ? onDownload : undefined}
      directDownloadBusy={downloadBusy}
      directDownloadLabel={downloadButtonLabel}
    />
  );
}
