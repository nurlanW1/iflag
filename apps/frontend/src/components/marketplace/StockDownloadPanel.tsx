'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { bytesToHuman, formatBadgeLabel, formatKindLabel } from '@/components/marketplace/asset-detail/format-metadata';
import { CopyLinkCartRow, type CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import { CanonicalFormatSlots } from '@/components/marketplace/asset-detail/CanonicalFormatSlots';
import { firstSelectableStockFileId } from '@/lib/marketplace/canonical-stock-formats';
import { NeonTrustFoot } from '@/components/marketplace/NeonDownloadKit';
import { DownloadPurchaseOffers } from '@/components/billing/DownloadPurchaseOffers';
import { ONE_TIME_STOCK } from '@/lib/marketing/pricing-config';
import { useFlagswingPlan } from '@/hooks/useFlagswingPlan';

const btnCompact =
  'inline-flex min-h-11 min-w-[2.75rem] shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-50';

type Props = {
  files: PublicProductFile[];
  cartProduct: CartProductRef;
  assetLabel?: string;
  productSlug?: string;
  licenseSummary?: string | null;
  /** Catalog JSON products — marketplace download API. */
  productId?: string;
  /** Free preview file in catalog (tier preview_free). */
  previewFile?: PublicProductFile | null;
  /** Parent-handled download (gallery legacy disk or entitled API). */
  onDirectDownload?: () => void;
  directDownloadBusy?: boolean;
  directDownloadLabel?: string;
  /** When false, active format is a free/public download (gallery). Default: pro tier. */
  requiresEntitlement?: boolean;
  /** Controlled format selection (gallery preview sync). */
  selectedId?: string | null;
  onSelectId?: (fileId: string) => void;
  headingId?: string;
  /** Marketplace PDP: tighter spacing to fit preview + buy block in view */
  compactLayout?: boolean;
};

function downloadPath(productId: string | undefined, fileId: string): string {
  if (productId) return `/api/marketplace/files/${productId}/${fileId}/download`;
  return `/api/download/${fileId}`;
}

/**
 * Unified stock download sidebar — format picker + purchase offers or download CTA.
 * Used on `/assets/*`, `/flags/*`, and gallery country pages.
 */
export function StockDownloadPanel({
  files,
  cartProduct,
  assetLabel,
  productSlug = ONE_TIME_STOCK.productSlug,
  licenseSummary,
  productId,
  previewFile,
  onDirectDownload,
  directDownloadBusy = false,
  directDownloadLabel,
  requiresEntitlement,
  selectedId,
  onSelectId,
  headingId = 'fmt-heading-stock',
  compactLayout = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const back = pathname || '/browse';
  const { authLoaded, hasActivePlan, planLoaded } = useFlagswingPlan();

  const sorted = useMemo(
    () =>
      [...files].sort((a, b) => {
        const fa = a.format.toLowerCase().localeCompare(b.format.toLowerCase());
        return fa !== 0 ? fa : a.id.localeCompare(b.id);
      }),
    [files],
  );

  const firstId = useMemo(() => firstSelectableStockFileId(sorted), [sorted]);
  const controlled = onSelectId != null;
  const [internalSel, setInternalSel] = useState<string>('');

  useEffect(() => {
    if (controlled || !sorted.length) return;
    if (!internalSel || !sorted.some((f) => f.id === internalSel)) setInternalSel(firstId ?? '');
  }, [sorted, internalSel, firstId, controlled]);

  const sel = controlled ? (selectedId ?? '') : internalSel;
  const setSel = controlled ? onSelectId : setInternalSel;

  const active = sorted.find((f) => f.id === sel);
  const [busy, setBusy] = useState(false);

  const isPreviewSlot =
    previewFile != null && active?.id === previewFile.id && active.tier === 'preview_free';
  const needsEntitlement =
    requiresEntitlement ?? (active?.tier === 'pro' || Boolean(previewFile && !isPreviewSlot));
  const showPurchaseOffers =
    authLoaded &&
    planLoaded &&
    !hasActivePlan &&
    Boolean(active) &&
    needsEntitlement &&
    !isPreviewSlot &&
    !onDirectDownload;

  const onProtectedDownload = () => {
    if (!active?.id) return;
    const fmt = formatBadgeLabel(active.format);
    toast.success(`Starting ${fmt} download`);
    setBusy(true);
    void triggerApiFileDownload(downloadPath(productId, active.id), {
      onUnauthorized: () => {
        toast.message('Sign in required');
        router.push(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
      },
      onForbidden: () => toast.message('Choose a purchase option below'),
      onNotFound: () => toast.error('File unavailable'),
      onError: () => toast.error('Download failed'),
    }).finally(() => setBusy(false));
  };

  if (!sorted.length) {
    return (
      <p className="sr-only" role="status">
        No downloadable formats available.
      </p>
    );
  }

  const activeKind = active ? formatKindLabel(active.format) : 'Other';

  const actionBlock = !active ? null : showPurchaseOffers ? (
    <DownloadPurchaseOffers
      assetLabel={assetLabel ?? cartProduct.title}
      productSlug={productSlug}
      compact={compactLayout}
    />
  ) : onDirectDownload ? (
    <div className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Download</p>
        <p className="text-xs text-slate-600">{formatBadgeLabel(active.format)}</p>
      </div>
      <button
        type="button"
        disabled={directDownloadBusy}
        onClick={() => onDirectDownload()}
        className={`${btnCompact} bg-slate-950 text-white hover:bg-slate-900`}
      >
        <Download className="h-4 w-4" aria-hidden strokeWidth={2.25} />
        {directDownloadBusy ? '…' : directDownloadLabel?.replace(/^Download\s+/i, '') ?? 'Get'}
      </button>
    </div>
  ) : isPreviewSlot ? (
    <div className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Preview</p>
        <p className="text-xs text-slate-600">{formatBadgeLabel(active.format)} · free</p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onProtectedDownload()}
        className={`${btnCompact} bg-slate-950 text-white hover:bg-slate-900`}
      >
        <Download className="h-4 w-4" aria-hidden strokeWidth={2.25} />
        {busy ? '…' : 'Get'}
      </button>
    </div>
  ) : !authLoaded || !planLoaded ? (
    <button
      type="button"
      disabled
      className={`${btnCompact} w-full bg-slate-200 text-slate-500`}
    >
      Loading…
    </button>
  ) : hasActivePlan ? (
    <div className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Pro access</p>
        <p className="text-xs text-slate-600">{formatBadgeLabel(active.format)}</p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onProtectedDownload()}
        className={`${btnCompact} bg-slate-950 text-white hover:bg-slate-900`}
      >
        <Download className="h-4 w-4" aria-hidden strokeWidth={2.25} />
        {busy ? '…' : 'Download'}
      </button>
    </div>
  ) : (
    <DownloadPurchaseOffers
      assetLabel={assetLabel ?? cartProduct.title}
      productSlug={productSlug}
      compact={compactLayout}
    />
  );

  const renderPanel = (formatsHeadingId: string) => (
    <div
      className={clsx(
        compactLayout ? 'flex h-full min-h-0 flex-col justify-between gap-3' : 'flex flex-col gap-4',
      )}
    >
      <CanonicalFormatSlots
        headingId={formatsHeadingId}
        files={sorted}
        selectedId={sel}
        onSelect={setSel}
        compact={compactLayout}
      />
      {actionBlock}
      {active && !showPurchaseOffers && !onDirectDownload ? (
        <NeonTrustFoot
          bytesLabel={bytesToHuman(active.bytes)}
          kind={activeKind}
          summary={licenseSummary}
          eligibilityLineSuffix={isPreviewSlot ? 'Free preview download' : 'Included with your plan'}
        />
      ) : null}
      <div className={clsx('border-t border-slate-100', compactLayout ? 'pt-3' : 'pt-5')}>
        <CopyLinkCartRow product={cartProduct} />
      </div>
    </div>
  );

  return (
    <>
      <div className={clsx('hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col')}>{renderPanel(headingId)}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-[var(--cookie-banner-h,0px)] z-[110] pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-t-[1.25rem] border border-b-0 border-slate-200/80 bg-white/95 px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)+12px))] pt-4 shadow-[0_-6px_22px_-10px_rgba(15,23,42,0.14)] backdrop-blur-md backdrop-saturate-150 sm:px-5 sm:pt-5">
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-200/90 sm:mb-3 sm:w-[2.875rem]" aria-hidden />
          {renderPanel(`${headingId}-dock`)}
        </div>
      </div>
    </>
  );
}
