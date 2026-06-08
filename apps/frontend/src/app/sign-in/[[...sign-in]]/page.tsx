import Link from 'next/link';
import { Suspense } from 'react';
import { Flag } from 'lucide-react';
import { SignIn } from '@clerk/nextjs';
import { SignInRedirectClient } from './sign-in-redirect-client';
import { SITE_NAME } from '@/lib/seo/site-config';

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-[#fafaf9] via-white to-blue-50/30 px-4 py-10 supports-[padding:max(0px)]:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      {/* Brand header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 transition hover:opacity-80">
          <Flag size={32} className="text-[var(--brand-blue)]" strokeWidth={1.75} aria-hidden />
          <span className="text-xl font-bold tracking-tight text-[var(--brand-blue)]">{SITE_NAME}</span>
        </Link>
        <p className="mt-2 text-sm text-neutral-500">Sign in to access your downloads</p>
      </div>

      <Suspense
        fallback={
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        }
      >
        <SignInRedirectClient />
      </Suspense>

      <p className="mt-6 text-center text-xs text-neutral-400">
        <Link href="/" className="underline-offset-2 hover:text-[var(--brand-blue)] hover:underline">
          ← Back to site
        </Link>
      </p>
    </div>
  );
}
