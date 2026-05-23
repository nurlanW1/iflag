'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { bytesToHuman, formatBadgeLabel } from '@/components/marketplace/asset-detail/format-metadata';

type Props = {
  files: PublicProductFile[];
};

const segmentWrap = 'rounded-2xl bg-slate-100/95 p-1.5 ring-1 ring-slate-200/80';
const segmentBtn =
  'min-h-[2.875rem] min-w-[4rem] shrink-0 snap-start rounded-xl px-4 text-[14px] font-semibold tracking-wide transition-[color,background,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 sm:px-5';
const btnPrimary =
  'mt-8 flex min-h-[3.375rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--brand-blue)] px-5 text-[16px] font-semibold tracking-tight text-[#fafaf9] shadow-[0_8px_24px_-8px_rgba(12,39,72,0.55)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-[var(--brand-blue-hover)] hover:shadow-[0_14px_32px_-10px_rgba(12,39,72,0.52)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

/** Neon download block — refined segment control + brand CTA */
export function NeonAssetDownloads({ files }: Props) {
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

  const formatRow = (
    <div
      role="radiogroup"
      aria-label="Format"
      className={clsx(
        segmentWrap,
        '-mx-0.5 flex max-w-full gap-1 overflow-x-auto px-0.5 py-0.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:mx-0 sm:flex-wrap sm:overflow-visible',
      )}
    >
      {sorted.map((f) => {
        const on = active?.id === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={formatBadgeLabel(f.format)}
            onClick={() => setSel(f.id)}
            className={clsx(
              segmentBtn,
              on
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/90'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            {formatBadgeLabel(f.format)}
          </button>
        );
      })}
    </div>
  );

  const metaLine = active ? (
    <p className="mt-4 text-center text-[14px] font-medium tabular-nums text-slate-500 sm:text-left">
      <span className="text-slate-800">{formatBadgeLabel(active.format)}</span>
      <span className="mx-2 text-slate-300">·</span>
      <span>{bytesToHuman(active.bytes)}</span>
    </p>
  ) : null;

  const primaryButton = active ? (
    <button type="button" disabled={busy} onClick={() => void onPrimaryDownload()} className={btnPrimary}>
      <Download className="h-[1.125rem] w-[1.125rem] shrink-0 opacity-95" aria-hidden strokeWidth={2.25} />
      {busy ? 'Preparing…' : `Download ${formatBadgeLabel(active.format)}`}
    </button>
  ) : null;

  const block = (
    <div>
      {formatRow}
      {metaLine}
      {primaryButton}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-t-2xl border border-b-0 border-slate-200/90 bg-white/95 px-5 pb-6 pt-4 shadow-[0_-12px_48px_-16px_rgba(15,23,42,0.15)] backdrop-blur-md">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200/90" aria-hidden />
          {block}
        </div>
      </div>
    </>
  );
}
