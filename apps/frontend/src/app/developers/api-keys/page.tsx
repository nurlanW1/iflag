import Link from 'next/link';
import { ArrowRight, KeyRound } from 'lucide-react';
import { getClerkPublishableKey } from '@/lib/auth/clerk-env';
import ApiKeysPageClient from './ApiKeysPageClient';

function ApiKeysAuthUnavailable() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
        <div className="rounded-full bg-blue-100 p-5">
          <KeyRound size={32} className="text-[var(--brand-blue)]" aria-hidden />
        </div>
        <h1 className="text-3xl font-extrabold text-[#2a2a2a]">API Keys</h1>
        <p className="text-neutral-500 text-lg max-w-md">
          API key management requires account authentication. Configure Clerk in production to enable this page.
        </p>
        <Link
          href="/developers"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[var(--brand-blue-hover)]"
        >
          Back to developer tools
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </main>
  );
}

export default function ApiKeysPage() {
  const clerkUiEnabled = Boolean(getClerkPublishableKey());

  if (!clerkUiEnabled) {
    return <ApiKeysAuthUnavailable />;
  }

  return <ApiKeysPageClient />;
}
