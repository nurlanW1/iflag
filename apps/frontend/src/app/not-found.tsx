import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo/site-config';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <FileQuestion className="mb-4 h-14 w-14 text-[#009ab6]" aria-hidden />
      <h1 className="text-2xl font-black text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-600">
        We could not find that URL on {SITE_NAME}. It may have moved or been removed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[#009ab6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#007a8a]"
        >
          Home
        </Link>
        <Link
          href="/browse"
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Browse catalog
        </Link>
      </div>
    </main>
  );
}
