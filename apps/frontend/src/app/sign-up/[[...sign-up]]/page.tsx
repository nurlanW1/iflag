import Link from 'next/link';
import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';
import { SignUpRedirectClient } from './sign-up-redirect-client';

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-[#1e40af]/5 px-4 py-12">
      <p className="mb-6 text-center text-sm text-gray-500">
        <Link href="/" className="font-medium text-[#2563eb] hover:underline">
          ← Back to site
        </Link>
      </p>
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
    </div>
  );
}
