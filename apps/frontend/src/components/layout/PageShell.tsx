import type { ComponentPropsWithoutRef } from 'react';

type DivProps = ComponentPropsWithoutRef<'div'>;

/**
 * Primary page horizontal band: full viewport width with responsive gutters only
 * (see `globals.css` `.marketplace-shell`).
 */
export function PageShell({ className = '', ...props }: DivProps) {
  return <div className={`marketplace-shell min-w-0 ${className}`.trim()} {...props} />;
}
