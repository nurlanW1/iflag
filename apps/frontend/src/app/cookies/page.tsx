import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/cookies',
  'Cookie Policy',
  'Cookies and similar technologies used on this marketplace site. Template with customizable placeholders.'
);

export default function CookiesPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="Cookie Policy"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<Cookie className="h-8 w-8 text-[var(--brand-blue)]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">1. Introduction</h2>
        <p>
          This Cookie Policy explains how <strong>{P.OPERATOR_LEGAL_NAME}</strong> uses cookies and similar
          technologies on <strong>{P.TRADING_NAME}</strong>. It should be read alongside our{' '}
          <Link href="/privacy-policy" className="font-medium text-[var(--brand-blue)] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-sm text-neutral-500">Effective date: {P.EFFECTIVE_DATE}.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">2. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device. Similar technologies include local storage,
          session storage, pixels, and software development kits (SDKs) in apps.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">3. Categories we use</h2>
        <p>We group technologies into the following categories:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            <strong>Strictly necessary</strong> — required for security, authentication, session management,
            and checkout. These include <code>fs_access</code> (session token, 15 min) and{' '}
            <code>fs_refresh</code> (refresh token, 30 days).
          </li>
          <li>
            <strong>Functional</strong> — remembers UI preferences such as theme or search filters.
          </li>
          <li>
            <strong>Analytics</strong> — helps us understand usage and improve performance. We do not
            currently use third-party analytics with persistent identifiers.
          </li>
          <li>
            <strong>Marketing / advertising</strong> — we do not currently run personalized ad campaigns
            or share data with ad platforms.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">4. Consent and the site banner</h2>
        <p>
          Where required, we will request your consent before setting non-essential cookies. The banner stores
          your choice locally so we do not ask on every visit. You can change your preference at any time by
          clearing site cookies in your browser settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">5. Third parties</h2>
        <p>
          Payment processing is handled by <strong>{P.PAYMENT_PROCESSOR}</strong>, which may set their own
          strictly necessary cookies during checkout. See{' '}
          <a
            href="https://www.paddle.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--brand-blue)] hover:underline"
          >
            Paddle&apos;s Privacy Policy
          </a>{' '}
          for details.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">6. Managing cookies</h2>
        <p>
          You can block or delete cookies through your browser settings. Blocking strictly necessary cookies
          may break parts of the Service (for example sign-in or checkout).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">7. Do Not Track</h2>
        <p>We currently do not respond to Do Not Track (DNT) browser signals, as no industry standard has been adopted. We do not track users across third-party sites.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">8. Updates</h2>
        <p>
          We will update this policy when we change technologies or partners. Material changes will be
          announced via the email address on your account or a prominent notice on the site.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">9. Contact</h2>
        <p>
          <a className="font-medium text-[var(--brand-blue)] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </section>
    </LegalDocumentShell>
  );
}
