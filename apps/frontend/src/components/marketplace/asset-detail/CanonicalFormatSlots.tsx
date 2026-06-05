'use client';

import clsx from 'clsx';
import type { PublicProductFile } from '@/lib/marketplace/product-mapper';
import { bytesToHuman, formatBadgeLabel } from '@/components/marketplace/asset-detail/format-metadata';
import {
  STOCK_FORMAT_ORDER,
  countAvailableCanonicalSlots,
  extraStockFilesBeyondCanonical,
  fileAtStockSlot,
} from '@/lib/marketplace/canonical-stock-formats';

const segmentRail =
  'rounded-[1rem] bg-slate-100/98 p-2 ring-1 ring-slate-200/75';

type Props = {
  files: PublicProductFile[];
  selectedId: string;
  onSelect: (fileId: string) => void;
  /** id of adjacent <h2> (radiogroup label) */
  headingId: string;
  compact?: boolean;
  /** Tighter slot width for narrow PDP download column */
  narrowRail?: boolean;
};

/** Always shows EPS · SVG · PNG · JPG slots; missing files are disabled at 50% opacity. Rare non-canonical files render after these. */
export function CanonicalFormatSlots({ files, selectedId, onSelect, headingId, compact, narrowRail }: Props) {
  const extras = extraStockFilesBeyondCanonical(files);
  const availableCanon = countAvailableCanonicalSlots(files);

  const slotBtnBase = compact
    ? narrowRail
      ? 'flex min-h-[2.5rem] min-w-[3.35rem] shrink-0 snap-start flex-col items-center justify-center rounded-md px-1.5 py-1.5 sm:min-w-[3.5rem]'
      : 'flex min-h-[2.75rem] min-w-[4.35rem] shrink-0 snap-start flex-col items-center justify-center rounded-md px-2.5 py-2 sm:min-w-[4.65rem]'
    : 'flex min-h-[2.875rem] min-w-[5rem] shrink-0 snap-start flex-col items-center justify-center rounded-[0.6875rem] px-4 py-2.5 sm:min-w-[5.75rem]';
  const slotLabelCls =
    'font-bold leading-none tracking-[0.04em] text-slate-900 ' +
    (compact ? 'text-[12px]' : 'text-[13px]');
  const sizeLabelCls = compact
    ? 'mt-0.5 text-[10px] font-medium tabular-nums leading-none'
    : 'mt-1 text-[11px] font-medium tabular-nums leading-none';

  return (
    <section aria-labelledby={headingId}>
      <div
        className={clsx(
          'flex items-baseline justify-between gap-3',
          compact ? 'mb-2' : 'mb-3',
        )}
      >
        <h2
          id={headingId}
          className={clsx(
            'font-semibold uppercase tracking-[0.16em] text-slate-400',
            compact ? 'text-[10px]' : 'text-[11px]',
          )}
        >
          Included formats
        </h2>
        <span
          className={clsx(
            'font-medium tabular-nums text-slate-400',
            compact ? 'text-[10px]' : 'text-[11px]',
          )}
        >
          {availableCanon} / {STOCK_FORMAT_ORDER.length} formats
        </span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className={clsx(
          compact
            ? 'rounded-lg bg-slate-100/98 p-1.5 ring-1 ring-slate-200/75'
            : segmentRail,
          'flex overflow-x-auto [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] pb-px sm:flex-wrap sm:overflow-visible',
          compact ? 'gap-1 sm:gap-1.5' : 'gap-1.5 sm:gap-2',
        )}
      >
        {STOCK_FORMAT_ORDER.map((slot) => {
          const file = fileAtStockSlot(files, slot);
          if (!file) {
            return (
              <button
                key={slot}
                type="button"
                disabled
                tabIndex={-1}
                className={clsx(slotBtnBase, 'cursor-not-allowed opacity-50 select-none')}
                aria-label={`${slot}, not included`}
              >
                <span className={slotLabelCls}>{slot}</span>
                <span className={clsx(sizeLabelCls, 'text-slate-400')}>—</span>
              </button>
            );
          }

          const on = selectedId === file.id;
          const lbl = formatBadgeLabel(file.format);
          const sz = bytesToHuman(file.bytes);

          return (
            <button
              key={`${slot}-${file.id}`}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${lbl}, ${sz}`}
              onClick={() => onSelect(file.id)}
              className={clsx(
                slotBtnBase,
                'transition-[color,background,ring] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2',
                on
                  ? 'bg-white ring-2 ring-gray-900'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
              )}
            >
              <span className={slotLabelCls}>{slot}</span>
              <span className={clsx(sizeLabelCls, 'text-slate-500')}>{sz}</span>
            </button>
          );
        })}

        {extras.map((f) => {
          const on = selectedId === f.id;
          const lbl = formatBadgeLabel(f.format);
          const sz = bytesToHuman(f.bytes);
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${lbl}, ${sz}`}
              onClick={() => onSelect(f.id)}
              className={clsx(
                slotBtnBase,
                'transition-[color,background,ring] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2',
                on
                  ? 'bg-white ring-2 ring-gray-900'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
              )}
            >
              <span className={slotLabelCls}>{lbl}</span>
              <span className={clsx(sizeLabelCls, 'text-slate-500')}>{sz}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
