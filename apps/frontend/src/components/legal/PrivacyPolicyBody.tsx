import Link from 'next/link';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export function PrivacyPolicyBody() {
  const contactEmail = getPublicContactEmail();

  return (
    <>
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
          . If you maintain a separate address for privacy requests, publish it here once finalized.
        </p>
        <p>
          <strong>Registered / principal address (if you publish one):</strong> {P.REGISTERED_OFFICE}.{' '}
          <strong>Tax / company identifiers (only if you choose to publish):</strong> {P.VAT_OR_TAX_ID}.
        </p>
        <p className="text-sm text-gray-600">
          Effective date: {P.EFFECTIVE_DATE}. Update this date whenever you publish a new version users
          should read.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">2. Scope</h2>
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
        <h2 className="text-xl font-bold text-gray-900">3. Data we may collect</h2>
        <p>
          Depending on how you use the Service, we may process categories such as: account and profile
          details; authentication identifiers; billing and transaction records (often handled by our payment
          partner: <strong>{P.PAYMENT_PROCESSOR}</strong>); support messages; technical logs (IP address,
          device/browser type, approximate location from IP); usage and diagnostics; and marketing
          preferences where permitted.
        </p>
        <p>
          List the specific tools you rely on (hosting, analytics, email, ads, CRM) in an internal data map,
          and expand this section when you add a new vendor that processes personal data.
        </p>
        <p>We do not knowingly collect special-category data unless a feature explicitly requires it.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">4. Purposes and legal bases</h2>
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
            Run optional analytics or advertising where you have consented or law permits (consent /
            legitimate interests). Map each purpose to the legal bases that apply in your markets with qualified counsel.
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
          business transfer subject to safeguards. Maintain a subprocessor or vendor list if your regulator
          or customers expect it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">6. International transfers</h2>
        <p>
          We may process data in countries other than where you live. Describe the transfer tools you rely
          on (for example Standard Contractual Clauses or adequacy decisions) with advice from counsel.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">7. Retention</h2>
        <p>
          We keep personal data only as long as needed for the purposes above, including legal, tax, and
          dispute resolution needs. Add concrete retention periods for accounts, invoices, marketing
          consents, and logs as your operations mature.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">8. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict, or object to
          certain processing, and to data portability. You may withdraw consent where processing is
          consent-based. Explain how to exercise rights and any verification steps you require.
        </p>
        <p>
          You may lodge a complaint with a supervisory authority: {P.SUPER_AUTHORITY}. Add the authority
          name and website when finalized.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">9. Cookies and similar technologies</h2>
        <p>
          We use cookies and similar technologies as described in our{' '}
          <Link href="/cookies" className="font-medium text-[#009ab6] hover:underline">
            Cookie Policy
          </Link>
          . If you use advertising or cross-site analytics, describe your consent tool and opt-out links.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">10. Children</h2>
        <p>
          The Service is not directed to children under the age required in your region. State the minimum
          age you enforce and how you handle parental consent if minors may use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">11. Security</h2>
        <p>
          We implement administrative, technical, and organizational measures appropriate to the risk,
          such as encryption in transit, access controls, and vendor review. Security improves over time;
          avoid overstated marketing claims.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">12. Automated decision-making</h2>
        <p>
          State whether you use solely automated decisions that produce legal or similarly significant
          effects. If you do not, say so plainly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">13. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated version and revise
          the effective date. Describe how you notify users of material changes (email, banner, or account
          message).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">14. Contact</h2>
        <p>
          Questions about privacy:{' '}
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . Add a Data Protection Officer or EU/UK representative only if you appoint one.
        </p>
      </section>
    </>
  );
}
