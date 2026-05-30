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

/** Preview column only — download sidebar grows with content (no inner scroll on desktop). */
const PDP_PREVIEW_HEIGHT_CLASS = 'lg:h-[min(28rem,58vh)] lg:max-h-[min(28rem,58vh)] lg:min-h-0';

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
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div
        className={clsx(
          'max-h-[min(52vh,28rem)] min-h-[min(20rem,52vh)] shrink-0 overflow-hidden',
          PDP_PREVIEW_HEIGHT_CLASS,
        )}
      >
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

      <aside className="flex w-full flex-col justify-self-stretch lg:max-w-none lg:self-start">
        <div className="flex flex-col max-lg:min-h-0 max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none lg:rounded-xl lg:border lg:border-slate-200/80 lg:bg-white lg:p-1 lg:shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5 lg:overflow-visible">
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
              roomyDesktopSidebar
              selectedId={selectedFileId}
              onSelectId={setSelectedFileId}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
