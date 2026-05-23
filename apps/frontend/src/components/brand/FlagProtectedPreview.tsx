'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Extra Tailwind/classes; wrapper is typically `relative`/`absolute inset-0` fill. */
  className?: string;
};

/**
 * Best-effort deterrent: blocks native context menu (“Save image as”) on guarded flag tiles,
 * disables image drag-save in common browsers when paired with `draggable={false}` on descendants.
 * Not a cryptographic lock — CDN URLs remain addressable directly.
 */
export function FlagProtectedPreview({ children, className }: Props) {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- deliberate UX guardrail for asset previews
    <div
      data-flag-protected
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
      {children}
    </div>
  );
}
