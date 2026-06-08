'use client';

import clsx from 'clsx';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';

type Props = {
  compact?: boolean;
  message?: string;
  /** Hide Paddle footnote (e.g. free download only). */
  hideCheckoutNote?: boolean;
};

const btnBase =
  'inline-flex min-h-[2.25rem] flex-1 items-center justify-center rounded-lg px-3 text-xs font-semibold transition';

/**
 * Sidebar auth gate — sign in / sign up without breaking compact purchase rows.
 */
export function BillingSidebarAuthGate({
  compact = false,
  message = 'Sign in or create a free account to continue.',
  hideCheckoutNote = false,
}: Props) {
  const pathname = usePathname();
  const returnTo = pathname?.startsWith('/') ? pathname : '/gallery';
  const clerkUiEnabled = useClerkUiEnabled();

  if (!clerkUiEnabled) {
    return (
      <div
        className={clsx(
          'rounded-lg border border-slate-200 bg-white',
          compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
        )}
      >
        <p className={clsx('text-slate-600', compact ? 'text-[10px] leading-snug' : 'text-[11px]')}>{message}</p>
        <div className={clsx('flex flex-wrap gap-2', compact ? 'mt-1.5' : 'mt-2')}>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(returnTo)}`}
            className={clsx(btnBase, 'border border-slate-900 bg-white text-slate-900 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]')}
          >
            Sign in
          </Link>
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(returnTo)}`}
            className={clsx(btnBase, 'bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]')}
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-lg border border-slate-200 bg-white',
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
      )}
    >
      <p className={clsx('text-slate-600', compact ? 'text-[10px] leading-snug' : 'text-[11px]')}>{message}</p>
      <div className={clsx('flex flex-wrap gap-2', compact ? 'mt-1.5' : 'mt-2')}>
        <SignInButton mode="redirect" forceRedirectUrl={returnTo}>
          <button
            type="button"
            className={clsx(
              btnBase,
              'border border-slate-900 bg-white text-slate-900 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]',
            )}
          >
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="redirect" forceRedirectUrl={returnTo}>
          <button
            type="button"
            className={clsx(btnBase, 'bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]')}
          >
            Sign up
          </button>
        </SignUpButton>
      </div>
      {!hideCheckoutNote ? (
        <p className={clsx('text-slate-400', compact ? 'mt-1 text-[9px]' : 'mt-1.5 text-[10px]')}>
          Paid checkout is hosted by Paddle.
        </p>
      ) : null}
    </div>
  );
}
