'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { formatBadgeLabel } from '@/components/marketplace/asset-detail/format-metadata';

type Props = {
  files: PublicProductFile[];
  /** One-line license summary (optional, below CTA). */
  licenseHint?: string | null;
};

/** Neon PDP — Freepik-style segmented formats + brand primary download. */
export function NeonAssetDownloads({ files, licenseHint }: Props) {
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

  const hint =
    licenseHint != null && licenseHint.length > 0 ? (
      <div className="mt-5 flex gap-2.5 text-[13px] leading-snug text-neutral-600">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white [&>svg]:h-3.5 [&>svg]:w-3.5">
          <Check aria-hidden strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-3">{licenseHint}</p>
          <Link
            href="/licenses"
            className="mt-1 inline-block font-semibold text-[var(--brand-blue)] underline-offset-2 hover:underline"
          >
            What&apos;s this?
          </Link>
        </div>
      </div>
    ) : null;

  const formatRow = (
    <div
      role="radiogroup"
      aria-label="Format"
      className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-neutral-100 p-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] md:flex-wrap md:gap-1"
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
              'min-w-[2.75rem] shrink-0 rounded-md px-3 py-2 text-[13px] font-semibold transition-[color,background,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2',
              on
                ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/90'
                : 'text-neutral-600 hover:bg-white/65 hover:text-neutral-900',
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
        'mt-6 w-full rounded-md bg-[var(--brand-blue)] py-4 text-[16px] font-semibold leading-none text-[#fafaf9]',
        'shadow-[0_2px_10px_-2px_rgba(12,39,72,0.55)] transition-colors hover:bg-[var(--brand-blue-hover)] disabled:opacity-50',
      )}
    >
      {busy ? 'Preparing…' : `Download ${formatBadgeLabel(active.format)}`}
    </button>
  ) : null;

  const block = (
    <div>
      {formatRow}
      {primaryButton}
      {hint}
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{block}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[max(10px,env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto rounded-t-xl border-x border-t border-neutral-200/95 bg-white px-4 pb-5 pt-4 shadow-[0_-14px_40px_-22px_rgba(15,23,42,0.2)]">
          {block}
        </div>
      </div>
    </>
  );
}
