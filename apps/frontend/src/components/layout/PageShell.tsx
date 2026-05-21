import type { ComponentPropsWithoutRef } from 'react';

type DivProps = ComponentPropsWithoutRef<'div'>;

/**
 * Primary page rail: horizontally centered with max width 1540px and responsive gutters
 * (see `globals.css` `.marketplace-shell` and `--marketplace-shell-max-width`).
 */
export function PageShell({ className = '', ...props }: DivProps) {
  return <div className={`marketplace-shell min-w-0 ${className}`.trim()} {...props} />;
}
