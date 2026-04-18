import Link from 'next/link';
import { Shield } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/privacy',
  'Privacy Policy',
  'How we collect, use, and protect personal data for this digital marketplace. Template with customizable placeholders.'
);

export default function PrivacyPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="Privacy Policy"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<Shield className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">1. Who we are</h2>
        <p>
          This Privacy Policy describes how <strong>{P.OPERATOR_LEGAL_NAME}</strong> (“we”, “us”) processes
          personal data when you use <strong>{P.TRADING_NAME}</strong> (the “Service”).
        </p>
        <p>
          <strong>Contact:</strong>{' '}
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . [PLACEHOLDER: add a dedicated privacy inbox if different from general support.]
        </p>
        <p>
          <strong>Registered / principal address (if you publish one):</strong> {P.REGISTERED_OFFICE}.{' '}
          <strong>Tax / company identifiers (only if you choose to publish):</strong> {P.VAT_OR_TAX_ID}.
        </p>
        <p className="text-sm text-gray-600">
          Effective date: {P.EFFECTIVE_DATE}. [PLACEHOLDER: version history / change log link if you maintain
          one.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">2. Scope</h2>
        <p>
          This policy applies to visitors, account holders, buyers, subscribers, and others who interact
          with the Service. [PLACEHOLDER: list apps, widgets, or white-label surfaces if applicable.]
        </p>
        <p>
          If you access the Service on behalf of a company, you represent that you have authority to share
          any personal data you provide. [PLACEHOLDER: B2B / reseller wording if relevant.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">3. Data we may collect</h2>
        <p>
          Depending on how you use the Service, we may process categories such as: account and profile
          details; authentication identifiers; billing and transaction records (often handled by our payment
          partner: <strong>{P.PAYMENT_PROCESSOR}</strong>); support messages; technical logs (IP address,
          device/browser type, approximate location from IP); usage and diagnostics; and marketing
          preferences where permitted.
        </p>
        <p>
          [PLACEHOLDER: list each analytics, advertising, fraud-prevention, email, CRM, or hosting provider
          you use, and whether data is collected automatically.]
        </p>
        <p>
          We do not knowingly collect special-category data. [PLACEHOLDER: adjust if your product could
          collect health, biometric, or children’s data.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">4. Purposes and legal bases</h2>
        <p>We process personal data to:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Provide, secure, and improve the Service (contract / legitimate interests).</li>
          <li>Process purchases, subscriptions, and tax or invoicing obligations where applicable (contract / legal obligation).</li>
          <li>Communicate service and security notices (contract / legitimate interests).</li>
          <li>Respond to requests and enforce our terms (legitimate interests / legal obligation).</li>
          <li>
            Run optional analytics or advertising where you have consented or law permits (consent /
            legitimate interests). [PLACEHOLDER: map each purpose to GDPR Article 6 / UK GDPR / other local
            bases.]
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">5. Sharing and processors</h2>
        <p>
          We share personal data with vendors that help us operate the Service (hosting, email, support
          tooling, payment processing). Payment data is typically collected directly by{' '}
          <strong>{P.PAYMENT_PROCESSOR}</strong> subject to their terms and privacy notice.
        </p>
        <p>
          We may disclose information if required by law, to protect rights and safety, or as part of a
          business transfer subject to safeguards. [PLACEHOLDER: add subprocessors list or link to one.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">6. International transfers</h2>
        <p>
          We may process data in countries other than where you live. [PLACEHOLDER: describe transfer
          mechanisms — e.g. EU Standard Contractual Clauses, UK IDTA, adequacy decisions, or other safeguards
          required in your markets.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">7. Retention</h2>
        <p>
          We keep personal data only as long as needed for the purposes above, including legal, tax, and
          dispute resolution needs. [PLACEHOLDER: insert retention schedule — e.g. account data until
          deletion + grace period; invoices7–10 years where required; logs 30–90 days unless security
          incident.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">8. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict, or object to
          certain processing, and to data portability. You may withdraw consent where processing is
          consent-based. [PLACEHOLDER: list rights under GDPR, UK GDPR, CCPA/CPRA, LGPD, PIPEDA, etc., as
          applicable.]
        </p>
        <p>
          You may lodge a complaint with a supervisory authority: {P.SUPER_AUTHORITY}. [PLACEHOLDER: add
          clickable authority name and website when finalized.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">9. Cookies and similar technologies</h2>
        <p>
          We use cookies and similar technologies as described in our{' '}
          <Link href="/cookies" className="font-medium text-[#009ab6] hover:underline">
            Cookie Policy
          </Link>
          . [PLACEHOLDER: if you run ads or cross-site tracking, describe consent management platform and
          opt-out links.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">10. Children</h2>
        <p>
          The Service is not directed to children under the age required in your region. [PLACEHOLDER:
          specify minimum age — e.g. 13 / 16 — and parental consent flow if you allow minors.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">11. Security</h2>
        <p>
          We implement administrative, technical, and organizational measures appropriate to the risk.
          [PLACEHOLDER: high-level security practices — encryption in transit, access controls, vendor
          reviews — without over-claiming “bank-grade” security.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">12. Automated decision-making</h2>
        <p>
          [PLACEHOLDER: state if you use solely automated decisions with legal/similar effects; if none,
          say so plainly.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">13. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated version and revise
          the effective date. [PLACEHOLDER: describe notice method for material changes — email, banner, or
          account message.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">14. Contact</h2>
        <p>
          Questions about privacy:{' '}
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . [PLACEHOLDER: Data Protection Officer or EU/UK representative contact if appointed.]
        </p>
      </section>
    </LegalDocumentShell>
  );
}
