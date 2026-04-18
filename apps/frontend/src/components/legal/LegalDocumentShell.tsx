import type { ReactNode } from 'react';
import Link from 'next/link';
import { LEGAL_TEMPLATE_NOTICE } from '@/lib/legal/legal-placeholders';

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** ISO date for “Last updated” when you maintain one */
  lastUpdated?: string;
};

export function LegalDocumentShell({ title, subtitle, icon, children, lastUpdated }: Props) {
  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-8 border-b border-gray-100 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            {icon}
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
            </div>
          </div>
          {lastUpdated ? (
            <p className="mt-4 text-sm text-gray-500">
              Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
            </p>
          ) : null}
        </header>

        <aside
          className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          aria-label="Template notice"
        >
          <p>{LEGAL_TEMPLATE_NOTICE}</p>
          <p className="mt-2">
            Related:{' '}
            <Link href="/privacy" className="font-medium text-amber-900 underline">
              Privacy
            </Link>
            {' · '}
            <Link href="/terms" className="font-medium text-amber-900 underline">
              Terms
            </Link>
            {' · '}
            <Link href="/refunds" className="font-medium text-amber-900 underline">
              Refunds
            </Link>
            {' · '}
            <Link href="/licenses" className="font-medium text-amber-900 underline">
              Licensing
            </Link>
            {' · '}
            <Link href="/cookies" className="font-medium text-amber-900 underline">
              Cookies
            </Link>
            {' · '}
            <Link href="/contact" className="font-medium text-amber-900 underline">
              Contact
            </Link>
            .
          </p>
        </aside>

        <div className="space-y-8 text-base leading-relaxed text-gray-800">{children}</div>
      </article>
    </main>
  );
}
