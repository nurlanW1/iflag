'use client';

import { useEffect, useMemo, useState } from 'react';
import { firstSelectableStockFileId } from '@/lib/marketplace/canonical-stock-formats';
import clsx from 'clsx';
import type { PublicProduct } from '@/lib/marketplace/product-mapper';
import { hrefLooksLikeNonBrowserMaster, pickFormatPreviewUrl } from '@/lib/flag-preview-display';
import type { ProductVideoPlayback } from '@/lib/marketplace/product-video-playback';
import { PremiumAssetPreview } from '@/components/marketplace/asset-detail/PremiumAssetPreview';
import { VideoAssetPreview } from '@/components/marketplace/asset-detail/VideoAssetPreview';
import { NeonAssetDownloads } from '@/components/marketplace/NeonAssetDownloads';
import type { CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import type { ProductFile } from '@/types/marketplace';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';

/** Equal-height PDP row on desktop — fits viewport below nav + title. */
const PDP_ROW_HEIGHT_CLASS =
  'lg:h-[min(40rem,calc(100dvh-10.5rem))] lg:max-h-[min(40rem,calc(100dvh-10.5rem))]';

type Props = {
  productTitle: string;
  publicProduct: PublicProduct;
  catalogFiles: ProductFile[];
  dedupedFiles: PublicProductFile[];
  formatHints: string[];
  useTransparencyBackdrop: boolean;
  watermarkEnabled: boolean;
  paid: boolean;
  cartProduct: CartProductRef;
  licenseSummary: string | null;
  neonDownloads: boolean;
  productId?: string;
  previewFilePublic: PublicProductFile | null;
  videoPlayback: ProductVideoPlayback | null;
};

export function ProductDetailPreviewColumn({
  productTitle,
  publicProduct,
  catalogFiles,
  dedupedFiles,
  formatHints,
  useTransparencyBackdrop,
  watermarkEnabled,
  paid,
  cartProduct,
  licenseSummary,
  neonDownloads,
  productId,
  previewFilePublic,
  videoPlayback,
}: Props) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const defaultFileId = useMemo(() => firstSelectableStockFileId(dedupedFiles), [dedupedFiles]);

  useEffect(() => {
    if (!defaultFileId) return;
    setSelectedFileId((cur) => (cur && dedupedFiles.some((f) => f.id === cur) ? cur : defaultFileId));
  }, [defaultFileId, dedupedFiles]);

  const defaultPreviewUrls = useMemo(
    () =>
      [...new Set([publicProduct.previewUrl, publicProduct.thumbnailUrl].filter(Boolean))] as string[],
    [publicProduct.previewUrl, publicProduct.thumbnailUrl],
  );

  const previewUrls = useMemo(() => {
    const active = selectedFileId ? catalogFiles.find((f) => f.id === selectedFileId) : null;
    const fromFormat = (active?.displayPreviewUrl ?? active?.publicUrl)?.trim();
    if (fromFormat && !hrefLooksLikeNonBrowserMaster(fromFormat)) {
      return [fromFormat, ...defaultPreviewUrls];
    }
    if (active) {
      const sibling = pickFormatPreviewUrl(
        catalogFiles.map((f) => ({
          format: f.format,
          previewUrl: f.displayPreviewUrl ?? f.publicUrl,
        })),
        defaultPreviewUrls,
      );
      if (sibling) return [sibling, ...defaultPreviewUrls];
    }
    return defaultPreviewUrls;
  }, [selectedFileId, catalogFiles, defaultPreviewUrls]);

  return (
    <div
      className={clsx(
        'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,21rem)] lg:items-stretch lg:gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]',
        PDP_ROW_HEIGHT_CLASS,
      )}
    >
      <div className="flex min-h-[min(20rem,48vh)] max-h-[min(52vh,28rem)] min-w-0 flex-col overflow-hidden lg:h-full lg:max-h-none lg:min-h-0">
        {videoPlayback ? (
          <VideoAssetPreview
            className="h-full min-h-0"
            productTitle={productTitle}
            videoUrl={videoPlayback.videoUrl}
            posterUrl={videoPlayback.posterUrl}
            format={videoPlayback.format}
          />
        ) : (
          <PremiumAssetPreview
            className="h-full min-h-0"
            productTitle={productTitle}
            previewUrls={previewUrls}
            formatHints={formatHints}
            useTransparencyBackdrop={useTransparencyBackdrop}
            variant="gallery"
            density="compact"
            watermarkEnabled={watermarkEnabled}
          />
        )}
      </div>

      <aside className="flex min-h-0 min-w-0 flex-col lg:h-full">
        <div className="flex min-h-0 flex-1 flex-col max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none lg:rounded-xl lg:border lg:border-slate-200/80 lg:bg-white lg:shadow-sm">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4 lg:overscroll-contain">
            <NeonAssetDownloads
              cartProduct={cartProduct}
              files={dedupedFiles}
              licenseSummary={licenseSummary}
              assetLabel={productTitle}
              productSlug={cartProduct.slug}
              productId={neonDownloads ? undefined : productId}
              previewFile={neonDownloads ? undefined : previewFilePublic}
              requiresEntitlement={neonDownloads ? undefined : paid}
              compactLayout
              narrowDesktopSidebar
              selectedId={selectedFileId}
              onSelectId={setSelectedFileId}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
