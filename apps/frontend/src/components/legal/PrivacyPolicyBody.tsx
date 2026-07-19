import Link from 'next/link';
import { P, getPublicContactEmail, getPublicContactPhoneDisplay, getPublicContactPhoneHref } from '@/lib/legal/legal-placeholders';

export function PrivacyPolicyBody() {
  const contactEmail = getPublicContactEmail();
  const contactPhone = getPublicContactPhoneDisplay();
  const contactPhoneHref = getPublicContactPhoneHref();

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">1. Who we are</h2>
        <p>
          This Privacy Policy describes how <strong>{P.OPERATOR_LEGAL_NAME}</strong> (“we”, “us”) processes
          personal data when you use <strong>{P.TRADING_NAME}</strong> (the “Service”).
        </p>
        <p>
          <strong>Contact:</strong>{' '}
          <a className="font-medium text-[var(--brand-blue)] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
{' '}or by phone at{' '}
          <a className="font-medium text-[var(--brand-blue)] hover:underline" href={contactPhoneHref}>
            {contactPhone}
          </a>
          .
        </p>
        <p className="text-sm text-neutral-500">
          Effective date: {P.EFFECTIVE_DATE}.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">2. Scope</h2>
        <p>
          This policy applies to visitors, account holders, buyers, subscribers, and others who interact with
          the Service, including when you browse pages, create an account, purchase a license, or contact
          support.
        </p>
        <p>
          If you access the Service on behalf of a company, you represent that you have authority to share
          any personal data you provide for that organization.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">3. Data we may collect</h2>
        <p>
          Depending on how you use the Service, we may process categories such as: account and profile
          details; authentication identifiers; billing and transaction records (often handled by our payment
          partner: <strong>{P.PAYMENT_PROCESSOR}</strong>); support messages; technical logs (IP address,
          device/browser type, approximate location from IP); usage and diagnostics; and marketing
          preferences where permitted.
        </p>
        <p>
          Analytics and advertising tools may be used only as described in this policy and the Cookie Policy.
        </p>
        <p>We do not knowingly collect special-category data unless a feature explicitly requires it.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">4. Purposes and legal bases</h2>
        <p>We process personal data to:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Provide, secure, and improve the Service (contract / legitimate interests).</li>
          <li>
            Process purchases, subscriptions, and tax or invoicing obligations where applicable (contract /
            legal obligation).
          </li>
          <li>Communicate service and security notices (contract / legitimate interests).</li>
          <li>Respond to requests and enforce our terms (legitimate interests / legal obligation).</li>
          <li>
            Run optional analytics or advertising where you have consented or where law permits (consent /
            legitimate interests).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">5. Sharing and processors</h2>
        <p>
          We share personal data with vendors that help us operate the Service (hosting, email, support
          tooling, payment processing). Payment data is typically collected directly by{' '}
          <strong>{P.PAYMENT_PROCESSOR}</strong> subject to their terms and privacy notice.
        </p>
        <p>
          We may disclose information if required by law, to protect rights and safety, or as part of a
          business transfer subject to safeguards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">6. International transfers</h2>
        <p>
          We may process data in countries other than where you live, using vendor, contractual, and technical
          safeguards appropriate to the services we use.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">7. Retention</h2>
        <p>
          We keep personal data only as long as needed for the purposes above, including legal, tax, and
          dispute resolution needs. Account and purchase records are retained while needed to provide access,
          support billing, and meet legal obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">8. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict, or object to
          certain processing, and to data portability. You may withdraw consent where processing is
          consent-based. Contact us using the details on this page to exercise these rights; we may need to
          verify your request before acting on it.
        </p>
        <p>
          You may lodge a complaint with a supervisory authority where applicable in your location.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">9. Cookies and similar technologies</h2>
        <p>
          We use cookies and similar technologies as described in our{' '}
          <Link href="/cookies" className="font-medium text-[var(--brand-blue)] hover:underline">
            Cookie Policy
          </Link>
          . Where required, optional analytics or advertising cookies are controlled through the cookie notice
          or browser-level settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">10. Children</h2>
        <p>
          The Service is not directed to children under the age required in their region. If you believe a child
          provided personal data, contact us so we can review and remove it where appropriate.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">11. Security</h2>
        <p>
          We implement administrative, technical, and organizational measures appropriate to the risk,
          such as encryption in transit, access controls, and vendor review. Security improves over time;
          avoid overstated marketing claims.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">12. Automated decision-making</h2>
        <p>
          We do not use solely automated decisions that produce legal or similarly significant effects.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">13. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated version and revise
          the effective date. Material changes may be announced by email, account notice, or a prominent site notice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">14. Contact</h2>
        <p>
          Questions about privacy:{' '}
          <a className="font-medium text-[var(--brand-blue)] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
.
        </p>
      </section>
    </>
  );
}
