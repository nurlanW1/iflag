import clsx from 'clsx';

/** Favicon-motif pole + banner (aligned with `app/icon.tsx`). Use with `text-white`. */
export function BrandFlagGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 22 22"
      className={clsx('shrink-0', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="1" width="3" height="20" rx="2" fill="currentColor" />
      <rect x="4" y="2" width="15" height="10" rx="3" fill="currentColor" />
    </svg>
  );
}

type PhotoWatermarkOverlayProps = {
  className?: string;
};

/**
 * Centered site-logo watermark — white glyphs at 50% opacity.
 * Parent must be `position: relative`. Keep ribbons/badges at `z-10` or above.
 */
export function PhotoWatermarkOverlay({ className }: PhotoWatermarkOverlayProps) {
  return (
    <div
      className={clsx('pointer-events-none absolute inset-0 z-[5] flex items-center justify-center', className)}
      aria-hidden
    >
      <BrandFlagGlyph className="h-[min(30%,12rem)] w-auto max-w-[min(68%,260px)] text-white opacity-50 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]" />
    </div>
  );
}
