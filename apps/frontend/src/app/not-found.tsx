import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
        <FileQuestion className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">Page not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        We couldn&apos;t find that URL on {SITE_NAME}. It may have moved or been removed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)]"
        >
          Back to home
        </Link>
        <Link
          href="/gallery"
          className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
        >
          Browse gallery
        </Link>
      </div>
    </main>
  );
}
