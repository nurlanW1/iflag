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

/** Neon PDP — segmented format pills, one meta line; desktop in-panel + mobile sticky dock. */
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
      <p className="mt-6 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-500 md:border-t md:pt-6">
        No formats available.
      </p>
    );
  }

  const pillRow = (
    <div
      role="radiogroup"
      aria-label="Formats"
      className="flex gap-2 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] md:flex-wrap md:overflow-visible"
    >
      {sorted.map((f) => {
        const on = active?.id === f.id;
        const isPro = f.tier === 'pro';
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${formatBadgeLabel(f.format)}${isPro ? ', premium format' : ''}`}
            onClick={() => setSel(f.id)}
            className={clsx(
              'shrink-0 snap-start whitespace-nowrap rounded-full px-[1.125rem] py-2 text-[13px] font-semibold uppercase tracking-[0.04em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
              on ? 'scale-[1.02] bg-slate-900 text-white shadow-md' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200',
              !on && isPro ? 'ring-1 ring-neutral-900/22' : null,
            )}
          >
            {formatBadgeLabel(f.format)}
          </button>
        );
      })}
    </div>
  );

  const selectedLine = active ? (
    <p className="mt-3 text-[15px] text-neutral-600">
      <span className="font-semibold text-neutral-950">{formatBadgeLabel(active.format)}</span>
      <span className="mx-1.5 font-light text-neutral-300">·</span>
      <span className="tabular-nums">{bytesToHuman(active.bytes)}</span>
    </p>
  ) : null;

  const primaryButton = active ? (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onPrimaryDownload()}
      className={clsx(
        'mt-4 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white transition',
        'bg-slate-900 shadow-[0_10px_28px_-14px_rgba(15,23,42,0.55)] hover:bg-slate-800 active:bg-slate-900',
        busy && 'opacity-65',
      )}
    >
      <Download className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      {busy ? 'Preparing…' : `Download ${formatBadgeLabel(active.format)}`}
    </button>
  ) : null;

  const block = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Formats</p>
      <div className="mt-1.5">{pillRow}</div>
      {selectedLine}
      {primaryButton}
    </div>
  );

  return (
    <>
      <div className="mt-6 hidden border-t border-neutral-100 pt-6 md:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto mx-auto rounded-t-2xl border border-b-0 border-neutral-200/90 bg-white/98 px-[4vw] pt-4 shadow-[0_-16px_48px_-14px_rgba(15,23,42,0.2)] backdrop-blur-md">
          {block}
        </div>
      </div>
    </>
  );
}
