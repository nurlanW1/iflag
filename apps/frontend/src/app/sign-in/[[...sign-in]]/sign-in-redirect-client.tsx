'use client';

import { useSearchParams } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url';

export function SignInRedirectClient() {
  const sp = useSearchParams();
  const target = sanitizeCallbackUrl(sp.get('redirect_url'), '/dashboard');
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(target)}`;
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl={signUpUrl}
      forceRedirectUrl={target}
      fallbackRedirectUrl={target}
    />
  );
}
