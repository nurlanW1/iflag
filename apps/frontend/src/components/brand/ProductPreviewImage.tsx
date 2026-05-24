'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import { PhotoWatermarkOverlay } from '@/components/brand/PhotoWatermark';

type Props = {
  children: ReactNode;
  /** Extra Tailwind/classes; wrapper is typically `relative`/`absolute inset-0` fill. */
  className?: string;
  /** When true, overlay the catalog watermark. Default false — opt-in for product previews only. */
  watermarkEnabled?: boolean;
  /** When true, block context menu / drag / text selection. Default true for product previews. */
  protectEnabled?: boolean;
};

/**
 * Marketplace product preview shell — optional watermark + best-effort save deterrents.
 *
 * TODO: Right-click protection is UI-level only.
 * Real premium protection requires private R2 originals + signed download URLs.
 */
export function ProductPreviewImage({
  children,
  className,
  watermarkEnabled = false,
  protectEnabled = true,
}: Props) {
  const inner = (
    <>
      {children}
      {watermarkEnabled ? <PhotoWatermarkOverlay /> : null}
    </>
  );

  if (!protectEnabled) {
    return <div className={className}>{inner}</div>;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- deliberate UX guardrail for product previews
    <div
      data-product-preview
      role="presentation"
      className={clsx(
        'select-none [-webkit-user-drag:none] [&_img]:pointer-events-none [&_img]:select-none',
        className,
      )}
      onContextMenu={(e) => {
        const t = e.target as Node | null;
        if (t && e.currentTarget.contains(t)) e.preventDefault();
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {inner}
    </div>
  );
}
