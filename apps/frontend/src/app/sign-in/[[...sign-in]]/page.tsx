import Link from 'next/link';
import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';
import { SignInRedirectClient } from './sign-in-redirect-client';

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-[#1e40af]/5 px-4 py-12">
      <p className="mb-6 text-center text-sm text-gray-500">
        <Link href="/" className="font-medium text-[#2563eb] hover:underline">
          ← Back to site
        </Link>
      </p>
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
    </div>
  );
}
