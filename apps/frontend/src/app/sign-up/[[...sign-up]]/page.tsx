import Link from 'next/link';
import { Suspense } from 'react';
import { Flag } from 'lucide-react';
import { SignUp } from '@clerk/nextjs';
import { SignUpRedirectClient } from './sign-up-redirect-client';
import { SITE_NAME } from '@/lib/seo/site-config';

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-[#fafaf9] via-white to-blue-50/30 px-4 py-10 supports-[padding:max(0px)]:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      {/* Brand header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 transition hover:opacity-80">
          <Flag size={32} className="text-[var(--brand-blue)]" strokeWidth={1.75} aria-hidden />
          <span className="text-xl font-bold tracking-tight text-[var(--brand-blue)]">{SITE_NAME}</span>
        </Link>
        <p className="mt-2 text-sm text-neutral-500">Free account — access 200+ official flags instantly</p>
      </div>

      <Suspense
        fallback={
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
          />
        }
      >
        <SignUpRedirectClient />
      </Suspense>

      <p className="mt-6 text-center text-xs text-neutral-400">
        <Link href="/" className="underline-offset-2 hover:text-[var(--brand-blue)] hover:underline">
          ← Back to site
        </Link>
      </p>
    </div>
  );
}
