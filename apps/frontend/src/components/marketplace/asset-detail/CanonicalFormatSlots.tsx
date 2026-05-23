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
  'rounded-[1rem] bg-slate-100/98 p-1.5 ring-1 ring-slate-200/75';

type Props = {
  files: PublicProductFile[];
  selectedId: string;
  onSelect: (fileId: string) => void;
  /** id of adjacent <h2> (radiogroup label) */
  headingId: string;
};

/** Always shows EPS · SVG · PNG · JPG slots; missing files are disabled at 50% opacity. Rare non-canonical files render after these. */
export function CanonicalFormatSlots({ files, selectedId, onSelect, headingId }: Props) {
  const extras = extraStockFilesBeyondCanonical(files);
  const availableCanon = countAvailableCanonicalSlots(files);

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Included formats
        </h2>
        <span className="text-[11px] font-medium tabular-nums text-slate-400">
          {availableCanon} / {STOCK_FORMAT_ORDER.length} formats
        </span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className={clsx(
          segmentRail,
          'flex gap-1 overflow-x-auto [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] pb-px sm:flex-wrap sm:overflow-visible',
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
                className="flex min-w-[4.85rem] shrink-0 snap-start cursor-not-allowed flex-col items-center justify-center rounded-[0.6875rem] px-4 py-2.5 opacity-50 select-none sm:min-w-[5.75rem]"
                aria-label={`${slot}, not included`}
              >
                <span className="text-[13px] font-bold leading-none tracking-[0.04em] text-slate-900">{slot}</span>
                <span className="mt-1 text-[11px] font-medium tabular-nums leading-none text-slate-400">—</span>
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
                'flex min-w-[4.85rem] shrink-0 snap-start flex-col items-center justify-center rounded-[0.6875rem] px-4 py-2.5 transition-[color,background,ring] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 sm:min-w-[5.75rem]',
                on
                  ? 'bg-white ring-2 ring-[var(--brand-blue)]/38'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
              )}
            >
              <span className="text-[13px] font-bold leading-none tracking-[0.04em] text-slate-900">{slot}</span>
              <span className="mt-1 text-[11px] font-medium tabular-nums leading-none text-slate-500">{sz}</span>
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
                'flex min-w-[4.85rem] shrink-0 snap-start flex-col items-center justify-center rounded-[0.6875rem] px-4 py-2.5 transition-[color,background,ring] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 sm:min-w-[5.75rem]',
                on
                  ? 'bg-white ring-2 ring-[var(--brand-blue)]/38'
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
}
