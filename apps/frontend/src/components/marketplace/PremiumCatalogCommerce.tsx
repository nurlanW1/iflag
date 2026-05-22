'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { formatBadgeLabel } from '@/components/marketplace/asset-detail/format-metadata';

type Props = {
  productId: string;
  productSlug: string;
  currency: string;
  paidCatalog: boolean;
  files: PublicProductFile[];
  previewFile: PublicProductFile | null;
  licenseHint?: string | null;
};

/** Catalog PDP — same Freepik-style panel as Neon; Paddle checkout inherits brand styling. */
export function PremiumCatalogCommerce({
  productId,
  productSlug,
  currency: _currency,
  paidCatalog,
  files,
  previewFile,
  licenseHint,
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

  if (!sorted.length) {
    return (
      <p className="sr-only" role="status">
        No files published for this asset.
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

  const cta = previewReady ? (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onPreviewDl()}
      className={clsx(
        'mt-6 w-full rounded-md bg-[var(--brand-blue)] py-4 text-[16px] font-semibold leading-none text-[#fafaf9]',
        'shadow-[0_2px_10px_-2px_rgba(12,39,72,0.55)] transition-colors hover:bg-[var(--brand-blue-hover)] disabled:opacity-50',
      )}
    >
      {busy ? 'Preparing…' : `Download ${formatBadgeLabel(active!.format)}`}
    </button>
  ) : paidCatalog && active?.tier === 'pro' ? (
    <div className="mt-6">
      <CheckoutButton
        kind="one_time"
        productSlug={productSlug}
        className={clsx(
          'flex w-full items-center justify-center rounded-md bg-[var(--brand-blue)] px-5 py-4 text-[16px] font-semibold text-[#fafaf9]',
          'shadow-[0_2px_10px_-2px_rgba(12,39,72,0.55)] transition-colors hover:bg-[var(--brand-blue-hover)] disabled:opacity-50',
        )}
      >
        Get Premium Access
      </CheckoutButton>
    </div>
  ) : null;

  const block = (
    <div>
      {formatRow}
      {cta}
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
