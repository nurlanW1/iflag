import type { ComponentPropsWithoutRef } from 'react';

/**
 * Narrow reading column inside a {@link PageShell} (legal copy, long-form articles).
 */
export function ContentReadable({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={`marketplace-prose w-full min-w-0 ${className}`.trim()} {...props} />;
}
