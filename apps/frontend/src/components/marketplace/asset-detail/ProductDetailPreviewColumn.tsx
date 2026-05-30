'use client';

import { useMemo, useState } from 'react';
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
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
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

      <aside className="flex min-h-0 w-full max-w-xl flex-col justify-self-stretch lg:max-w-none">
        <div
          className={clsx(
            'flex min-h-[min(20rem,52vh)] flex-1 flex-col overflow-hidden max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none lg:rounded-xl lg:border lg:border-slate-200/80 lg:bg-white lg:shadow-sm',
            PDP_PREVIEW_HEIGHT_CLASS,
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3.5 sm:p-4">
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
              selectedId={selectedFileId}
              onSelectId={setSelectedFileId}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
