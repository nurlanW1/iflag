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

const CHECKER_BG = {
  background:
    'repeating-conic-gradient(#e0e0e0 0% 25%, white 0% 50%) 0 0 / 20px 20px',
} as React.CSSProperties;

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

function formatBytes(b: number): string {
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

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
  const [ownsProduct, setOwnsProduct] = useState(false);

  useEffect(() => {
    const slug = cartProduct.slug?.trim();
    if (!slug) return;
    let cancelled = false;
    const q = new URLSearchParams({ productSlug: slug });
    const agk = cartProduct.assetGroupKey?.trim();
    if (agk) q.set('assetGroupKey', agk);
    void fetch(`/api/account/flagswing-plan?${q.toString()}`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ownsProduct?: boolean } | null) => {
        if (!cancelled) setOwnsProduct(Boolean(j?.ownsProduct));
      })
      .catch(() => {
        if (!cancelled) setOwnsProduct(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cartProduct.slug, cartProduct.assetGroupKey]);

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
    <div className="grid gap-5 lg:grid-cols-[3fr_2fr] lg:items-start">
      {/* LEFT — preview with checkered transparency background */}
      <div
        className="flex min-h-[min(20rem,50vh)] flex-col overflow-hidden rounded-2xl border border-gray-200 lg:h-[min(34rem,calc(100dvh-14rem))]"
        style={CHECKER_BG}
      >
        <div className="flex flex-1 min-h-0 items-center justify-center p-2">
          {videoPlayback ? (
            <VideoAssetPreview
              className="h-full min-h-0 w-full"
              productTitle={productTitle}
              videoUrl={videoPlayback.videoUrl}
              posterUrl={videoPlayback.posterUrl}
              format={videoPlayback.format}
            />
          ) : (
            <PremiumAssetPreview
              className="h-full min-h-0 w-full"
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
        {/* ALPHA PREVIEW label */}
        <div className="shrink-0 border-t border-gray-200/80 bg-black/[0.025] py-2.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
            Alpha Preview
          </span>
        </div>
      </div>

      {/* RIGHT — download panel */}
      <aside className="min-w-0 max-lg:w-full">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <NeonAssetDownloads
            cartProduct={cartProduct}
            files={dedupedFiles}
            licenseSummary={licenseSummary}
            assetLabel={productTitle}
            productSlug={cartProduct.slug}
            assetGroupKey={cartProduct.assetGroupKey}
            assetProductSlug={cartProduct.slug}
            countrySlug={cartProduct.countrySlug}
            productId={neonDownloads ? undefined : productId}
            previewFile={neonDownloads ? undefined : previewFilePublic}
            requiresEntitlement={neonDownloads ? undefined : paid}
            compactLayout
            narrowDesktopSidebar
            mobileBottomDock={false}
            ownsProduct={ownsProduct}
            onAlreadyPurchased={() => setOwnsProduct(true)}
            selectedId={selectedFileId}
            onSelectId={setSelectedFileId}
          />
        </div>
      </aside>
    </div>
  );
}
