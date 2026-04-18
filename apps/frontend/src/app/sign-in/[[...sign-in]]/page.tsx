import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-[#006d7a]/5 px-4 py-12">
      <p className="mb-6 text-center text-sm text-gray-500">
        <Link href="/" className="font-medium text-[#009ab6] hover:underline">
          ← Back to site
        </Link>
      </p>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
