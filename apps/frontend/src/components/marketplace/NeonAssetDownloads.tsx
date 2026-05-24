'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { bytesToHuman, formatBadgeLabel, formatKindLabel } from '@/components/marketplace/asset-detail/format-metadata';
import { CopyLinkCartRow, type CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import { CanonicalFormatSlots } from '@/components/marketplace/asset-detail/CanonicalFormatSlots';
import { firstSelectableStockFileId } from '@/lib/marketplace/canonical-stock-formats';
import { NeonPrimaryDownloadButton, NeonTrustFoot } from '@/components/marketplace/NeonDownloadKit';
import { DownloadPurchaseOffers } from '@/components/billing/DownloadPurchaseOffers';
import { useFlagswingPlan } from '@/hooks/useFlagswingPlan';

type Props = {
  files: PublicProductFile[];
  licenseSummary?: string | null;
  cartProduct: CartProductRef;
  assetLabel?: string;
  productSlug?: string;
};

/** Neon — premium segmented formats + slate CTA + trust microcopy (APIs unchanged). */
export function NeonAssetDownloads({
  files,
  licenseSummary,
  cartProduct,
  assetLabel,
  productSlug,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const back = pathname || '/browse';
  const { isSignedIn, authLoaded, hasActivePlan, planLoaded } = useFlagswingPlan();

  const sorted = useMemo(
    () =>
      [...files].sort((a, b) => {
        const fa = a.format.toLowerCase().localeCompare(b.format.toLowerCase());
        return fa !== 0 ? fa : a.id.localeCompare(b.id);
      }),
    [files],
  );

  const firstId = useMemo(() => firstSelectableStockFileId(sorted), [sorted]);
  const [sel, setSel] = useState<string>('');

  useEffect(() => {
    if (!sorted.length) return;
    if (!sel || !sorted.some((f) => f.id === sel)) setSel(firstId ?? '');
  }, [sorted, sel, firstId]);

  const active = sorted.find((f) => f.id === sel);
  const [busy, setBusy] = useState(false);

  const showPurchaseOffers =
    authLoaded && planLoaded && !hasActivePlan && Boolean(active);

  const onPrimaryDownload = () => {
    if (!active?.id) return;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
      return;
    }
    const fmt = formatBadgeLabel(active.format);
    toast.success(`Starting ${fmt} download`);
    const path = `/api/download/${active.id}`;
    setBusy(true);
    void triggerApiFileDownload(path, {
      onUnauthorized: () => {
        toast.message('Sign in required');
        router.push(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
      },
      onForbidden: () => {
        toast.message('Choose a purchase option below');
      },
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

  const formatRow = (
    <CanonicalFormatSlots headingId="fmt-heading-neon" files={sorted} selectedId={sel} onSelect={setSel} />
  );

  const primaryButton = active ? (
    showPurchaseOffers ? (
      <DownloadPurchaseOffers
        assetLabel={assetLabel ?? cartProduct.title}
        productSlug={productSlug ?? cartProduct.slug}
        compact
      />
    ) : (
      <NeonPrimaryDownloadButton
        busy={busy}
        disabled={busy || (!authLoaded && !planLoaded)}
        label={
          !authLoaded || !planLoaded
            ? 'Loading…'
            : !isSignedIn
              ? 'Sign in to download'
              : `Download ${formatBadgeLabel(active.format)}`
        }
        onClick={() => void onPrimaryDownload()}
      />
    )
  ) : null;

  const block = (
    <div className="flex flex-col gap-6">
      {formatRow}
      {primaryButton}
      {active && !showPurchaseOffers ? (
        <NeonTrustFoot bytesLabel={bytesToHuman(active.bytes)} kind={activeKind} summary={licenseSummary} />
      ) : null}
      <div className="border-t border-slate-100 pt-5">
        <CopyLinkCartRow product={cartProduct} />
      </div>
    </div>
  );

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
