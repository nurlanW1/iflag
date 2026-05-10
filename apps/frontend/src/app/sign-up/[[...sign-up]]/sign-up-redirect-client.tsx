'use client';

import { useSearchParams } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url';

export function SignUpRedirectClient() {
  const sp = useSearchParams();
  const target = sanitizeCallbackUrl(sp.get('redirect_url'), '/dashboard');
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(target)}`;
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl={signInUrl}
      forceRedirectUrl={target}
      fallbackRedirectUrl={target}
    />
  );
}
