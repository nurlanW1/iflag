'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { formatBadgeLabel } from '@/components/marketplace/asset-detail/format-metadata';

type Props = {
  files: PublicProductFile[];
};

/** Neon asset page — underline format tabs + single download button; sticky bar on small screens only. */
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

  const formatTabs = (
    <div
      role="radiogroup"
      aria-label="Format"
      className="flex gap-0 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:flex-wrap md:overflow-visible"
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
              'shrink-0 border-b-2 px-3 py-2 text-[15px] font-medium transition-colors first:pl-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
              on ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-600',
            )}
          >
            {formatBadgeLabel(f.format)}
          </button>
        );
      })}
    </div>
  );

  const primaryButton = active ? (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onPrimaryDownload()}
      className={clsx(
        'mt-5 w-full rounded-lg bg-neutral-950 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50',
      )}
    >
      {busy ? 'Preparing…' : `Download ${formatBadgeLabel(active.format)}`}
    </button>
  ) : null;

  const block = (
    <div>
      {formatTabs}
      {primaryButton}
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto border-t border-neutral-200 bg-white/95 px-4 pt-3 shadow-[0_-8px_40px_-16px_rgba(15,23,42,0.14)] backdrop-blur-sm">
          {block}
        </div>
      </div>
    </>
  );
}
