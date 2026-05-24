'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, useAuth, useUser } from '@clerk/nextjs';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { useClerkUiEnabled } from '@/components/providers/ClerkUiProvider';
import { postPaddleCheckout } from '@/lib/billing/client-checkout';

type Props = {
  planSlug: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

function PricingProSubscribeClerk({ planSlug, className, style, children }: Props) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = pathname?.startsWith('/') ? pathname : '/pricing';

  const onSubscribeClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await postPaddleCheckout(getToken, {
        kind: 'subscription',
        planSlug,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <button
        type="button"
        disabled
        style={style}
        className={
          className ||
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white opacity-50'
        }
      >
        Loading…
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <div>
        <SignInButton mode="redirect" forceRedirectUrl={returnTo}>
          <button
            type="button"
            style={style}
            className={
              className ||
              'w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]'
            }
          >
            Sign in to continue
          </button>
        </SignInButton>
        <p className="mt-2 text-center text-xs text-gray-500">
          Sign in with your account — checkout is hosted by Paddle.
        </p>
      </div>
    );
  }

  const email =
    user?.primaryEmailAddress?.emailAddress?.trim() ||
    user?.emailAddresses?.[0]?.emailAddress?.trim();

  return (
    <div>
      <button
        type="button"
        onClick={() => void onSubscribeClick()}
        disabled={loading}
        style={style}
        className={
          className ||
          'w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-50'
        }
      >
        {loading ? 'Redirecting…' : children}
      </button>
      {email ? (
        <p className="mt-2 text-center text-xs text-gray-500">
          Signed in as {email} — secure Paddle checkout.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function PricingProSubscribeLegacy({ className, style, children }: Props) {
  const pathname = usePathname();
  const returnTo = pathname?.startsWith('/') ? pathname : '/pricing';

  return (
    <div>
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(returnTo)}`}
        style={style}
        className={
          className ||
          'flex w-full items-center justify-center rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]'
        }
      >
        Sign in to continue
      </Link>
      <p className="mt-2 text-center text-xs text-gray-500">
        Sign in with your account — checkout is hosted by Paddle.
      </p>
    </div>
  );
}

/**
 * Pro plan subscribe on /pricing — Clerk client auth only (no backend cookie session).
 */
export function PricingProSubscribe(props: Props) {
  const clerkUiEnabled = useClerkUiEnabled();
  if (!clerkUiEnabled) {
    return <PricingProSubscribeLegacy {...props} />;
  }
  return <PricingProSubscribeClerk {...props} />;
}
