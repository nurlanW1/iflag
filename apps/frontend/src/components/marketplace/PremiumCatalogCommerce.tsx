'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { bytesToHuman, formatBadgeLabel, formatKindLabel } from '@/components/marketplace/asset-detail/format-metadata';
import { CopyLinkCartRow, type CartProductRef } from '@/components/marketplace/asset-detail/CopyLinkCartRow';
import { CanonicalFormatSlots } from '@/components/marketplace/asset-detail/CanonicalFormatSlots';
import { firstSelectableStockFileId } from '@/lib/marketplace/canonical-stock-formats';

type Props = {
  productId: string;
  productSlug: string;
  currency: string;
  paidCatalog: boolean;
  files: PublicProductFile[];
  previewFile: PublicProductFile | null;
  licenseSummary?: string | null;
  cartProduct: CartProductRef;
};

const dlBtn =
  'group/dl relative mt-8 flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-slate-950 px-5 text-[16px] font-semibold tracking-tight text-[#fafaf9] transition-[transform,background-color] duration-200 hover:bg-slate-900 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

function PreviewTrustFoot({
  bytesLabel,
  kind,
  summary,
}: {
  bytesLabel: string;
  kind: string;
  summary?: string | null;
}) {
  return (
    <div className="mt-5 space-y-3">
      <p className="text-center text-[12px] font-medium tracking-wide text-slate-500 sm:text-left">
        <span className="tabular-nums text-slate-600">{bytesLabel}</span>
        <span className="mx-2 text-slate-300">·</span>
        Instant preview download
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700 ring-1 ring-slate-200/90">
          {kind}
        </span>
        {summary ? (
          <span
            className="line-clamp-2 max-w-full rounded-full bg-emerald-50/90 px-3 py-1 text-[11px] font-medium leading-snug text-emerald-900 ring-1 ring-emerald-200/80"
            title={summary}
          >
            {summary}
          </span>
        ) : (
          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
            See license terms
          </span>
        )}
      </div>
    </div>
  );
}

function CheckoutTrustFoot({ summary }: { summary?: string | null }) {
  return (
    <div className="mt-5 space-y-3">
      <p className="text-center text-[12px] font-medium tracking-wide text-slate-500 sm:text-left">
        Full-resolution masters · Included formats unlocked
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        {summary ? (
          <span
            className="line-clamp-2 max-w-full rounded-full bg-emerald-50/90 px-3 py-1 text-[11px] font-medium leading-snug text-emerald-900 ring-1 ring-emerald-200/80"
            title={summary}
          >
            {summary}
          </span>
        ) : (
          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
            License applies after checkout
          </span>
        )}
      </div>
    </div>
  );
}

export function PremiumCatalogCommerce({
  productId,
  productSlug,
  currency: _currency,
  paidCatalog,
  files,
  previewFile,
  licenseSummary,
  cartProduct,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const back = pathname || '/browse';

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

  const previewReady = previewFile != null && active?.id === previewFile.id && active?.tier === 'preview_free';

  const onPreviewDl = () => {
    if (!previewFile) return;
    const fmt = formatBadgeLabel(previewFile.format);
    toast.success(`Starting ${fmt} download`);
    const path = `/api/marketplace/files/${productId}/${previewFile.id}/download`;
    setBusy(true);
    void triggerApiFileDownload(path, {
      onUnauthorized: () => {
        toast.message('Sign in required');
        router.push(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
      },
      onForbidden: () => {
        toast.message('Purchase required');
        router.push(`/pricing?callbackUrl=${encodeURIComponent(back)}`);
      },
      onNotFound: () => toast.error('File unavailable'),
      onError: () => toast.error('Download failed'),
    }).finally(() => setBusy(false));
  };

  void _currency;

  if (!sorted.length) {
    return (
      <p className="sr-only" role="status">
        No files published for this asset.
      </p>
    );
  }

  const activeKind = active ? formatKindLabel(active.format) : 'Other';

  const formatRow = (
    <CanonicalFormatSlots
      headingId="fmt-heading-catalog"
      files={sorted}
      selectedId={sel}
      onSelect={setSel}
    />
  );

  const cta = previewReady ? (
    <button type="button" disabled={busy} onClick={() => void onPreviewDl()} className={dlBtn}>
      <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent opacity-70" aria-hidden />
      <Download className="relative h-[1.15rem] w-[1.15rem] shrink-0 opacity-[0.93] transition-transform duration-200 group-hover/dl:translate-y-px" aria-hidden strokeWidth={2.35} />
      <span className="relative">{busy ? 'Preparing…' : `Download ${formatBadgeLabel(active!.format)}`}</span>
    </button>
  ) : paidCatalog && active?.tier === 'pro' ? (
    <div className="relative mt-8">
      <CheckoutButton
        kind="one_time"
        productSlug={productSlug}
        className={clsx(
          'flex min-h-[3.5rem] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 px-6 text-[16px] font-semibold tracking-tight text-[#fafaf9]',
          'transition-[transform,background-color] duration-200 hover:bg-slate-900 active:scale-[0.99] disabled:opacity-50',
        )}
      >
        Get Premium Access
      </CheckoutButton>
    </div>
  ) : null;

  const footerTrust =
    previewReady && active ? (
      <PreviewTrustFoot bytesLabel={bytesToHuman(active.bytes)} kind={activeKind} summary={licenseSummary} />
    ) : paidCatalog && active?.tier === 'pro' ? (
      <CheckoutTrustFoot summary={licenseSummary} />
    ) : active ? (
      <div className="mt-6 text-[12px] leading-relaxed text-slate-500">
        Select another format above, or browse pricing for downloadable masters.
      </div>
    ) : null;

  const block = (
    <div className="space-y-0">
      {formatRow}
      <div>{cta}</div>
      {footerTrust}
      <CopyLinkCartRow product={cartProduct} />
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-t-[1.375rem] border border-b-0 border-slate-200/90 bg-white/96 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto mb-3 h-[2px] w-[2.875rem] rounded-full bg-gradient-to-r from-transparent via-slate-300 to-transparent" aria-hidden />
          {block}
        </div>
      </div>
    </>
  );
}
