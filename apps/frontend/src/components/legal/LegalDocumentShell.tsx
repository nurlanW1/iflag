import type { ReactNode } from 'react';
import Link from 'next/link';
import { ContentReadable } from '@/components/layout';

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
    <main className="min-h-screen bg-[#fafaf9]">
      <article className="marketplace-shell py-12 sm:py-16">
        <ContentReadable className="space-y-0">
          <header className="mb-8 border-b border-neutral-100 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              {icon}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#2a2a2a] sm:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm font-medium text-neutral-500">{subtitle}</p> : null}
              </div>
            </div>
            {lastUpdated ? (
              <p className="mt-3 text-xs text-neutral-400">
                Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
              </p>
            ) : null}
          </header>

          <nav
            className="mb-10 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm"
            aria-label="Policy links"
          >
            <span className="font-medium text-neutral-900">Policies:</span>{' '}
            <Link href="/privacy-policy" className="font-medium text-[var(--brand-blue)] underline-offset-4 hover:underline">
              Privacy
            </Link>
            {' | '}
            <Link href="/terms-of-service" className="font-medium text-[var(--brand-blue)] underline-offset-4 hover:underline">
              Terms
            </Link>
            {' | '}
            <Link href="/refunds" className="font-medium text-[var(--brand-blue)] underline-offset-4 hover:underline">
              Refunds
            </Link>
            {' | '}
            <Link href="/licenses" className="font-medium text-[var(--brand-blue)] underline-offset-4 hover:underline">
              Licensing
            </Link>
            {' | '}
            <Link href="/cookies" className="font-medium text-[var(--brand-blue)] underline-offset-4 hover:underline">
              Cookies
            </Link>
            {' | '}
            <Link href="/contact" className="font-medium text-[var(--brand-blue)] underline-offset-4 hover:underline">
              Contact
            </Link>
            .
          </nav>

          <div className="space-y-8 text-base leading-relaxed text-neutral-700">{children}</div>
        </ContentReadable>
      </article>
    </main>
  );
}
