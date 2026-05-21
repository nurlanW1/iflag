import type { ComponentPropsWithoutRef } from 'react';

type DivProps = ComponentPropsWithoutRef<'div'>;

/**
 * Flagswing primary wrapper: `w-full` + `.marketplace-shell` (centered max 1800px, responsive px).
 * Navbar, footer, and page mains should use this (or `marketplace-shell` directly).
 */
export function PageShell({ className = '', ...props }: DivProps) {
  return <div className={`marketplace-shell min-w-0 w-full ${className}`.trim()} {...props} />;
}
