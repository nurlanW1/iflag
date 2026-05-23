'use client';

import { Download } from 'lucide-react';

/** Slate primary CTA — shared by `/assets/...` (Neon) and `/gallery/[country]`. */
export const NEON_DOWNLOAD_BUTTON_CLASS =
  'group/dl relative flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-slate-950 px-5 text-[16px] font-semibold tracking-tight text-[#fafaf9] transition-[transform,background-color] duration-200 hover:bg-slate-900 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

type NeonTrustFootProps = {
  bytesLabel: string;
  kind: string;
  summary?: string | null;
  /** Trust line after the middle dot (Neon default). */
  eligibilityLineSuffix?: string;
};

export function NeonTrustFoot({
  bytesLabel,
  kind,
  summary,
  eligibilityLineSuffix = 'Instant download when eligible',
}: NeonTrustFootProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-[13px] font-medium leading-relaxed tracking-wide text-slate-500 sm:text-left">
        <span className="tabular-nums text-slate-600">{bytesLabel}</span>
        <span className="mx-2 text-slate-300">·</span>
        {eligibilityLineSuffix}
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

type NeonPrimaryDownloadButtonProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'type' | 'children'> & {
  busy?: boolean;
  label: string;
};

export function NeonPrimaryDownloadButton({ busy, label, disabled, className, ...rest }: NeonPrimaryDownloadButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${NEON_DOWNLOAD_BUTTON_CLASS} ${className ?? ''}`.trim()}
      {...rest}
    >
      <span
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent opacity-70"
        aria-hidden
      />
      <Download
        className="relative h-[1.15rem] w-[1.15rem] shrink-0 opacity-[0.93] transition-transform duration-200 group-hover/dl:translate-y-px"
        aria-hidden
        strokeWidth={2.35}
      />
      <span className="relative">{busy ? 'Preparing…' : label}</span>
    </button>
  );
}
