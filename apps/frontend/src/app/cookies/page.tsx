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
      icon={<Cookie className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
        <p>
          This Cookie Policy explains how <strong>{P.OPERATOR_LEGAL_NAME}</strong> uses cookies and similar
          technologies on <strong>{P.TRADING_NAME}</strong>. It should be read alongside our{' '}
          <Link href="/privacy-policy" className="font-medium text-[#009ab6] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600">Effective date: {P.EFFECTIVE_DATE}.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">2. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device. Similar technologies include local storage,
          session storage, pixels, and software development kits (SDKs) in apps. [PLACEHOLDER: link to a
          glossary if you maintain one.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">3. Categories we use</h2>
        <p>We group technologies into the following categories:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            <strong>Strictly necessary</strong> — required for security, load balancing, authentication,
            cart/checkout, and basic preferences. [PLACEHOLDER: list cookie names, purposes, duration.]
          </li>
          <li>
            <strong>Functional</strong> — remembers choices such as language or UI settings. [PLACEHOLDER:
            list cookie names, purposes, duration.]
          </li>
          <li>
            <strong>Analytics</strong> — helps us understand usage and improve performance. [PLACEHOLDER:
            name vendors — e.g. Plausible, GA4 — and whether IP anonymization is enabled.]
          </li>
          <li>
            <strong>Marketing / advertising</strong> — used to measure campaigns or personalize ads where
            permitted. [PLACEHOLDER: list ad platforms; whether remarketing is used; consent requirements.]
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">4. Consent and the site banner</h2>
        <p>
          Where required, we will request your consent before setting non-essential cookies. The banner stores
          your choice locally so we do not ask on every visit. [PLACEHOLDER: describe how to reopen the
          preference center; link to vendor opt-outs.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">5. Third parties</h2>
        <p>
          Payment processing may be handled by <strong>{P.PAYMENT_PROCESSOR}</strong>, which may set their own
          strictly necessary cookies during checkout. [PLACEHOLDER: embed links to processor cookie notices.]
        </p>
        <p>
          [PLACEHOLDER: social plugins, embedded videos, maps, or support chat widgets — each may set
          cookies.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">6. Managing cookies</h2>
        <p>
          You can block or delete cookies through your browser settings. Blocking strictly necessary cookies
          may break parts of the Service (for example sign-in or checkout).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">7. Do Not Track</h2>
        <p>[PLACEHOLDER: your DNT / Global Privacy Control response, if any.]</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">8. Updates</h2>
        <p>
          We will update this policy when we change technologies or partners. [PLACEHOLDER: material change
          notice approach.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">9. Contact</h2>
        <p>
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </section>
    </LegalDocumentShell>
  );
}
