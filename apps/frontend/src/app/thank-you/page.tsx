import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Download, ArrowRight } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `Purchase complete — ${SITE_NAME}`,
  robots: { index: false },
};

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-stone-900">Payment complete!</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Your purchase was successful. Head to your dashboard to download the files — they&apos;re
          ready instantly.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href="/dashboard"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
          >
            <Download size={16} aria-hidden />
            Go to my downloads
          </Link>

          <Link
            href="/gallery"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Continue browsing
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <p className="mt-6 text-xs text-stone-400">
          Receipt sent to your email. Questions?{' '}
          <Link href="/contact" className="text-[#2563eb] hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </main>
  );
}
