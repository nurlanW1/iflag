'use client';

import { useMemo } from 'react';
import { CanonicalFormatSlots } from '@/components/marketplace/asset-detail/CanonicalFormatSlots';
import { CopyLinkCartRow, type CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import { bytesToHuman, formatBadgeLabel, formatKindLabel } from '@/components/marketplace/asset-detail/format-metadata';
import {
  NeonPrimaryDownloadButton,
  NeonTrustFoot,
} from '@/components/marketplace/NeonDownloadKit';
import { DownloadPurchaseOffers } from '@/components/billing/DownloadPurchaseOffers';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { galleryFormatRowToPublicFile } from '@/lib/marketplace/gallery-format-files';

/** Country gallery API `formats` row (subset). */
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
  downloadDisabled: boolean;
  downloadButtonLabel: string;
  licenseSummary?: string | null;
  cartProduct: CartProductRef;
  /** Signed-in visitor without subscription — show buy vs subscribe offers. */
  showPurchaseOffers?: boolean;
  assetLabel?: string;
  productSlug?: string;
};

export function GalleryCountryDownloadsPanel({
  formats,
  selectedFormatId,
  onSelectFormatId,
  onDownload,
  downloadBusy,
  downloadDisabled,
  downloadButtonLabel,
  licenseSummary,
  cartProduct,
  showPurchaseOffers = false,
  assetLabel,
  productSlug,
}: Props) {
  const files = useMemo<PublicProductFile[]>(() => formats.map(galleryFormatRowToPublicFile), [formats]);

  const active = selectedFormatId ? files.find((f) => f.id === selectedFormatId) : null;
  const activeKind = active ? formatKindLabel(active.format) : 'Other';

  const block =
    files.length === 0 ? null : (
      <div className="flex flex-col gap-6">
        <CanonicalFormatSlots
          headingId="fmt-heading-gallery-country"
          files={files}
          selectedId={selectedFormatId ?? ''}
          onSelect={onSelectFormatId}
        />
        {selectedFormatId ? (
          showPurchaseOffers ? (
            <DownloadPurchaseOffers
              assetLabel={assetLabel}
              productSlug={productSlug}
              compact
            />
          ) : (
            <NeonPrimaryDownloadButton
              busy={downloadBusy}
              label={downloadButtonLabel}
              disabled={downloadDisabled || downloadBusy}
              onClick={() => onDownload()}
            />
          )
        ) : null}
        {active && !showPurchaseOffers ? (
          <NeonTrustFoot
            bytesLabel={bytesToHuman(active.bytes)}
            kind={activeKind}
            summary={licenseSummary}
          />
        ) : null}
        <div className="border-t border-slate-100 pt-5">
          <CopyLinkCartRow product={cartProduct} />
        </div>
      </div>
    );

  if (!block) {
    return (
      <p className="sr-only" role="status">
        No downloadable formats for this design.
      </p>
    );
  }

  return (
    <>
      <div className="hidden lg:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-[var(--cookie-banner-h,0px)] z-[110] pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-t-[1.375rem] border border-b-0 border-slate-200/90 bg-white/96 px-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+12px))] pt-5 shadow-[0_-8px_28px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto mb-3 h-1 w-[2.875rem] rounded-full bg-slate-200/90" aria-hidden />
          {block}
        </div>
      </div>
    </>
  );
}
