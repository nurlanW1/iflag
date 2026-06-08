import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Download, ArrowRight, Flag } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `Purchase complete — ${SITE_NAME}`,
  robots: { index: false },
};

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          {/* Success icon */}
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-50" />
            <CheckCircle className="relative h-8 w-8 text-emerald-500" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">Payment complete!</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Your purchase was successful. Head to your dashboard to download the files — they&apos;re
            ready instantly.
          </p>

          <div className="mt-6 space-y-2.5">
            <Link
              href="/dashboard/purchases"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
            >
              <Download size={16} aria-hidden />
              Go to my downloads
            </Link>

            <Link
              href="/gallery"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Continue browsing
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          <p className="mt-6 text-xs text-neutral-400">
            Receipt sent to your email. Questions?{' '}
            <Link href="/contact" className="text-[var(--brand-blue)] hover:underline">
              Contact us
            </Link>
          </p>
        </div>

        {/* Brand footer */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          <Flag size={13} className="text-neutral-300" aria-hidden />
          <span className="text-xs text-neutral-400">{SITE_NAME}</span>
        </div>
      </div>
    </main>
  );
}
