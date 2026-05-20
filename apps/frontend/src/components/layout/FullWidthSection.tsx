import type { ComponentPropsWithoutRef } from 'react';

/**
 * Edge-to-edge section wrapper (backgrounds, heroes). Inner rows should use {@link PageShell}.
 */
export function FullWidthSection({ className = '', ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section className={`relative w-full min-w-0 ${className}`.trim()} {...props} />;
}
