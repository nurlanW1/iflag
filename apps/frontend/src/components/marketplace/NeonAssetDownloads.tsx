'use client';

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

type Props = {
  files: PublicProductFile[];
  /** One compact line for commerce trust (license summary); optional */
  licenseSummary?: string | null;
  cartProduct: CartProductRef;
};

const dlBtn =
  'group/dl relative flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-slate-950 px-5 text-[16px] font-semibold tracking-tight text-[#fafaf9] transition-[transform,background-color] duration-200 hover:bg-slate-900 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

function TrustStrip({
  bytesLabel,
  kind,
  summary,
}: {
  bytesLabel: string;
  kind: string;
  summary?: string | null;
}) {
  return (
    <div className="space-y-4">
      <p className="text-center text-[13px] font-medium leading-relaxed tracking-wide text-slate-500 sm:text-left">
        <span className="tabular-nums text-slate-600">{bytesLabel}</span>
        <span className="mx-2 text-slate-300">·</span>
        Instant download when eligible
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
        <span className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-slate-100 px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700 ring-1 ring-slate-200/90">
          {kind}
        </span>
        {summary ? (
          <span
            className="inline-flex max-w-full min-h-[2.75rem] items-center justify-center rounded-xl bg-emerald-50/90 px-3.5 py-2 text-[11px] font-medium leading-snug text-emerald-900 ring-1 ring-emerald-200/80 line-clamp-2"
            title={summary}
          >
            {summary}
          </span>
        ) : (
          <span className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-slate-200/95 bg-white px-3.5 text-[12px] font-semibold text-slate-700 shadow-sm shadow-slate-500/[0.04]">
            See license terms
          </span>
        )}
      </div>
    </div>
  );
}

/** Neon — premium segmented formats + slate CTA + trust microcopy (APIs unchanged). */
export function NeonAssetDownloads({ files, licenseSummary, cartProduct }: Props) {
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

  const onPrimaryDownload = () => {
    if (!active?.id) return;
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
        toast.message('Subscription required');
        router.push(`/pricing?callbackUrl=${encodeURIComponent(back)}`);
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
    <button type="button" disabled={busy} onClick={() => void onPrimaryDownload()} className={dlBtn}>
      <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent opacity-70" aria-hidden />
      <Download className="relative h-[1.15rem] w-[1.15rem] shrink-0 opacity-[0.93] transition-transform duration-200 group-hover/dl:translate-y-px" aria-hidden strokeWidth={2.35} />
      <span className="relative">{busy ? 'Preparing…' : `Download ${formatBadgeLabel(active.format)}`}</span>
    </button>
  ) : null;

  const block = (
    <div className="flex flex-col gap-6">
      {formatRow}
      {primaryButton}
      {active ? <TrustStrip bytesLabel={bytesToHuman(active.bytes)} kind={activeKind} summary={licenseSummary} /> : null}
      <div className="border-t border-slate-100 pt-5">
        <CopyLinkCartRow product={cartProduct} />
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-t-[1.375rem] border border-b-0 border-slate-200/90 bg-white/96 px-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+12px))] pt-5 shadow-[0_-8px_28px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto mb-3 h-1 w-[2.875rem] rounded-full bg-slate-200/90" aria-hidden />
          {block}
        </div>
      </div>
    </>
  );
}
