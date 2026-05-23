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
import { CopyLinkShareRow } from '@/components/marketplace/asset-detail/CopyLinkShareRow';

type Props = {
  productId: string;
  productSlug: string;
  currency: string;
  paidCatalog: boolean;
  files: PublicProductFile[];
  previewFile: PublicProductFile | null;
  licenseSummary?: string | null;
};

const segmentRail =
  'rounded-[1rem] bg-slate-100/98 p-1.5 ring-1 ring-slate-200/75 shadow-inner';

const dlBtn =
  'group/dl relative mt-8 flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-slate-950 px-5 text-[16px] font-semibold tracking-tight text-[#fafaf9] transition-[transform,box-shadow,background-color] duration-200 hover:bg-slate-900 hover:shadow-[0_20px_40px_-18px_rgba(0,0,0,0.45)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

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

  const [sel, setSel] = useState<string>(sorted[0]?.id ?? '');

  useEffect(() => {
    if (!sorted.length) return;
    if (!sel || !sorted.some((f) => f.id === sel)) setSel(sorted[0]!.id);
  }, [sorted, sel]);

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
    <section aria-labelledby="fmt-heading-catalog">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="fmt-heading-catalog" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Included formats
        </h2>
        <span className="text-[11px] font-medium tabular-nums text-slate-400">{sorted.length} files</span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="fmt-heading-catalog"
        className={clsx(
          segmentRail,
          'flex gap-1 overflow-x-auto [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] pb-px sm:flex-wrap sm:overflow-visible',
        )}
      >
        {sorted.map((f) => {
          const on = active?.id === f.id;
          const lbl = formatBadgeLabel(f.format);
          const sz = bytesToHuman(f.bytes);
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${lbl}, ${sz}`}
              onClick={() => setSel(f.id)}
              className={clsx(
                'flex min-w-[4.85rem] shrink-0 snap-start flex-col items-center justify-center rounded-[0.6875rem] px-4 py-2.5 transition-[transform,color,background,box-shadow,ring] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 sm:min-w-[5.75rem]',
                on
                  ? 'bg-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] ring-2 ring-[var(--brand-blue)]/38'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
              )}
            >
              <span className="text-[13px] font-bold leading-none tracking-[0.04em] text-slate-900">{lbl}</span>
              <span className="mt-1 text-[11px] font-medium tabular-nums leading-none text-slate-500">{sz}</span>
            </button>
          );
        })}
      </div>
    </section>
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
          'shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-slate-900 hover:shadow-[0_22px_44px_-20px_rgba(0,0,0,0.5)] active:scale-[0.99] disabled:opacity-50',
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
      <CopyLinkShareRow />
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-t-[1.375rem] border border-b-0 border-slate-200/90 bg-white/96 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-28px_64px_-32px_rgba(15,23,42,0.18)] backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto mb-3 h-[2px] w-[2.875rem] rounded-full bg-gradient-to-r from-transparent via-slate-300 to-transparent" aria-hidden />
          {block}
        </div>
      </div>
    </>
  );
}
