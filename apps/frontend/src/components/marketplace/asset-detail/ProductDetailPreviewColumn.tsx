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
  'lg:h-[min(34rem,calc(100dvh-12rem))] lg:max-h-[min(34rem,calc(100dvh-12rem))]';

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
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('flagswing-preview-theme');
    if (saved === 'dark' || saved === 'light') setPreviewTheme(saved);
  }, []);

  const handleThemeChange = (t: 'light' | 'dark') => {
    setPreviewTheme(t);
    localStorage.setItem('flagswing-preview-theme', t);
  };

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
    <div
      className={clsx(
        'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]',
        PDP_ROW_HEIGHT_CLASS,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2 lg:h-full">
        {/* Dark / Light toggle */}
        <div className="flex shrink-0 items-center justify-end gap-0.5 self-end rounded-xl bg-slate-100/90 p-1">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleThemeChange(t)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                previewTheme === t
                  ? t === 'dark'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t === 'light' ? '☀️ Light' : '🌙 Dark'}
            </button>
          ))}
        </div>
        {/* Preview container */}
        <div
          className={clsx(
            'flex min-h-[min(18rem,44vh)] max-h-[min(48vh,26rem)] min-w-0 flex-col overflow-hidden rounded-xl transition-colors duration-200 lg:flex-1 lg:min-h-0 lg:max-h-none',
            previewTheme === 'dark' ? 'bg-slate-900' : 'bg-[#fafaf9]',
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
        {/* Format + size chips */}
        {dedupedFiles.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {dedupedFiles.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] shadow-sm"
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-slate-700">
                  {f.format}
                </span>
                {f.bytes != null && (
                  <span className="text-slate-400">{formatBytes(f.bytes)}</span>
                )}
                <span className="text-slate-400">↓</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <aside className="flex min-h-0 min-w-0 flex-col max-lg:w-full max-lg:flex-none">
        <div className="flex min-h-0 flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm max-lg:flex-none">
          <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 max-lg:overflow-visible lg:overflow-y-auto lg:overscroll-contain" style={{ maxHeight: 'min(34rem, calc(100dvh - 12rem))' }}>
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
        </div>
      </aside>
    </div>
  );
}
