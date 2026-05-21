import type { ComponentPropsWithoutRef } from 'react';

/**
 * Full-bleed outer wrapper (backgrounds, section bands). Inner rows use {@link PageShell}
 * / `marketplace-shell` so content stays within the 1800px centered rail.
 */
export function FullWidthSection({ className = '', ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section className={`relative w-full min-w-0 ${className}`.trim()} {...props} />;
}
