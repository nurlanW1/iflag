'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { Crown, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { triggerApiFileDownload } from '@/lib/client/trigger-api-download';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import {
  bytesToHuman,
  formatBadgeLabel,
  formatIconFor,
  pitchForExtension,
  shortMimeFamily,
} from '@/components/marketplace/asset-detail/format-metadata';

type Props = {
  productId: string;
  productSlug: string;
  currency: string;
  paidCatalog: boolean;
  files: PublicProductFile[];
  previewFile: PublicProductFile | null;
};

function accessLabel(file: PublicProductFile): string {
  return file.tier === 'pro' ? 'Premium' : 'Preview';
}

/**
 * Styled catalog PDP for JSON/seed-backed products — mirrors Neon tile UX without `/api/download/{uuid}`.
 */
export function PremiumCatalogCommerce({
  productId,
  productSlug,
  currency,
  paidCatalog,
  files,
  previewFile,
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

  const onPreviewDl = async () => {
    if (!previewFile) return;
    const fmt = formatBadgeLabel(previewFile.format);
    toast.success(`Fetching ${fmt} preview…`);
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
      onNotFound: () => toast.error('File not found.'),
      onError: () => toast.error('Download failed. Please retry.'),
    }).finally(() => setBusy(false));
  };

  const n = sorted.length;
  const previewReady = previewFile != null && active?.id === previewFile.id && active?.tier === 'preview_free';

  const panelFooter = (
    <>
      {previewReady ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onPreviewDl()}
          className="flex min-h-[3.125rem] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-base font-semibold text-white shadow-[0_10px_28px_-16px_rgb(21,128,61)] transition hover:bg-emerald-700 disabled:opacity-70"
        >
          <Download className="h-[1.125rem] w-[1.125rem]" aria-hidden />
          {busy ? 'Preparing…' : `Download ${formatBadgeLabel(active!.format)} preview`}
        </button>
      ) : null}

      {paidCatalog && active?.tier === 'pro' ? (
        <div className={clsx(!previewReady ? '' : 'mt-3 border-t border-dashed border-neutral-200 pt-3')}>
          <p className="text-xs text-neutral-600">
            Pro masters unlock after one-time Paddle purchase or Flagswing Premium access.
          </p>
          <div className="mt-3">
            <CheckoutButton
              kind="one_time"
              productSlug={productSlug}
              className="flex w-full min-h-[3.125rem] items-center justify-center rounded-xl bg-[var(--brand-blue)] px-4 text-base font-semibold text-white hover:bg-[var(--brand-blue-hover)]"
            >
              Buy with Paddle ({currency})
            </CheckoutButton>
          </div>
        </div>
      ) : paidCatalog === false ? (
        previewReady ? null : (
          <p className="text-xs text-neutral-600">
            Signed-in teammates with an active Flagswing Premium plan unlock gallery-native downloads separately.
          </p>
        )
      ) : null}
    </>
  );

  const panel =
    sorted.length === 0 ? (
      <div className="rounded-[1.1rem] border border-neutral-100 bg-neutral-50 p-7 text-center text-sm text-neutral-500">
        No files published for this product yet.
      </div>
    ) : active ? (
      <div className="rounded-[1.1rem] border border-neutral-200/95 bg-[linear-gradient(180deg,#fff_0%,#fafaf9_100%)] p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.03]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Delivery</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-[var(--brand-blue)]">
              {formatBadgeLabel(active.format)}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {bytesToHuman(active.bytes)}
              {shortMimeFamily(active.mimeType) ? ` · ${shortMimeFamily(active.mimeType)} output` : null}
            </p>
            <span
              className={clsx(
                'mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1',
                active.tier === 'pro'
                  ? 'bg-amber-50 text-amber-900 ring-amber-100'
                  : 'bg-emerald-50 text-emerald-800 ring-emerald-100',
              )}
            >
              {active.tier === 'pro' ? (
                <>
                  <Crown className="h-3 w-3" aria-hidden />
                  Paid master
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Free preview tier
                </>
              )}
            </span>
          </div>
          <Download className="h-9 w-9 shrink-0 text-neutral-300" aria-hidden />
        </div>
        <div className="mt-5 space-y-3">{panelFooter}</div>
      </div>
    ) : null;

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">Available formats</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {n > 1
            ? `${n} downloadable exports bundled as one product — pick whichever matches your toolchain.`
            : 'Licensed export curated for scalable marketing and print workflows.'}
        </p>
        <ul role="radiogroup" aria-label="Available formats" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sorted.map((f) => {
            const Icon = formatIconFor(f.format);
            const pitch = pitchForExtension(f.format);
            const on = active?.id === f.id;
            return (
              <li key={f.id}>
                <button
                  role="radio"
                  type="button"
                  aria-checked={on}
                  onClick={() => setSel(f.id)}
                  className={clsx(
                    'group flex min-h-[7.85rem] w-full flex-col justify-between rounded-2xl border bg-white px-4 py-[1.075rem] text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2',
                    on
                      ? 'scale-[1.01] border-[var(--brand-blue)] shadow-[0_28px_64px_-40px_var(--brand-blue-hover)] ring-2 ring-[var(--brand-blue)]/15'
                      : 'border-neutral-200/98 hover:border-neutral-300 hover:shadow-[0_20px_50px_-40px_rgba(15,23,42,0.2)] hover:-translate-y-0.5',
                  )}
                >
                  <span className="flex items-start gap-3.5">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-50 ring-1 ring-neutral-200/90 transition-colors group-hover:bg-white">
                      <Icon className="h-6 w-6 text-neutral-600" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 gap-y-1">
                        <span className="text-lg font-bold tracking-wide text-neutral-900">
                          {formatBadgeLabel(f.format)}
                        </span>
                        <span
                          className={clsx(
                            'inline-flex shrink-0 rounded-md px-2 py-[0.0625rem] text-[11px] font-bold uppercase tracking-wider ring-1',
                            f.tier === 'pro'
                              ? 'bg-amber-50 text-amber-900 ring-amber-100'
                              : 'bg-emerald-50 text-emerald-800 ring-emerald-100',
                          )}
                        >
                          {accessLabel(f)}
                        </span>
                      </span>
                      <span className="mt-2 block text-[0.9275rem] font-semibold text-neutral-800">
                        {pitch.headline}
                      </span>
                      <span className="mt-2 block text-[0.8375rem] leading-relaxed text-neutral-600">
                        {pitch.bestFor}
                      </span>
                    </span>
                  </span>
                  <span className="mt-4 flex justify-between gap-2 border-t border-dashed border-neutral-100 pt-4 text-[13px] text-neutral-500">
                    <span>
                      Weight{' '}
                      <strong className="font-semibold text-neutral-700">{bytesToHuman(f.bytes)}</strong>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="hidden md:block">{panel}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        <div className="pointer-events-auto mx-auto w-full border-y border-neutral-200/93 bg-[#fcfbfacc] px-[5vw] py-5 shadow-[0_-14px_50px_-14px_rgba(15,23,42,0.14)] backdrop-blur-lg">
          {panel}
        </div>
      </div>
      <div aria-hidden className="h-[10.875rem] shrink-0 md:hidden" />
    </div>
  );
}
