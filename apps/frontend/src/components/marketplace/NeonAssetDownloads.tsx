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

/** Neon PDP — premium segmented formats, single meta row, strong CTA (APIs unchanged). */
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
      className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-0.5 pt-0.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 md:gap-2"
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
              'min-h-[3rem] min-w-[4.25rem] shrink-0 snap-start rounded-xl px-5 text-[15px] font-semibold uppercase tracking-[0.06em] transition-[color,background,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:min-w-[4.5rem]',
              on
                ? 'scale-[1.02] bg-neutral-900 text-white shadow-lg shadow-neutral-900/25'
                : 'bg-neutral-100/90 text-neutral-600 ring-1 ring-neutral-200/80 hover:bg-neutral-200/85 hover:text-neutral-900',
            )}
          >
            {formatBadgeLabel(f.format)}
          </button>
        );
      })}
    </div>
  );

  const metaLine = active ? (
    <p className="mt-5 text-[15px] font-medium tabular-nums tracking-tight text-neutral-600">
      <span className="text-neutral-950">{formatBadgeLabel(active.format)}</span>
      <span className="mx-2 font-light text-neutral-300">·</span>
      <span>{bytesToHuman(active.bytes)}</span>
    </p>
  ) : null;

  const primaryButton = active ? (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onPrimaryDownload()}
      className={clsx(
        'mt-7 flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-950 px-5 text-[17px] font-semibold tracking-tight text-white',
        'shadow-[0_16px_42px_-22px_rgba(0,0,0,0.55)] transition-[transform,background,box-shadow] duration-200 hover:bg-neutral-800 hover:shadow-[0_22px_44px_-22px_rgba(0,0,0,0.58)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55',
      )}
    >
      <Download className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
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
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto rounded-t-[1.25rem] border border-b-0 border-neutral-200/90 bg-white px-5 pb-6 pt-5 shadow-[0_-24px_56px_-28px_rgba(15,23,42,0.22)]">
          {block}
        </div>
      </div>
    </>
  );
}
