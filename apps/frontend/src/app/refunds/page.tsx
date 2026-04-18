import Link from 'next/link';
import { Banknote } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/refunds',
  'Refund Policy',
  'Refunds, cancellations, and billing disputes for digital goods and subscriptions. Template with customizable placeholders.'
);

export default function RefundsPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="Refund Policy"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<Banknote className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">1. Overview</h2>
        <p>
          This Refund Policy explains how cancellations, refunds, and billing disputes work for purchases
          made through <strong>{P.TRADING_NAME}</strong>, operated by{' '}
          <strong>{P.OPERATOR_LEGAL_NAME}</strong>. It supplements our{' '}
          <Link href="/terms-of-service" className="font-medium text-[#009ab6] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600">Effective date: {P.EFFECTIVE_DATE}.</p>
        <p>
          Payments may be processed by <strong>{P.PAYMENT_PROCESSOR}</strong>. In some cases, their
          dispute or chargeback rules may also apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">2. Digital goods</h2>
        <p>
          Many jurisdictions treat digital content delivered instantly as final once delivery begins, with
          limited cancellation rights. [PLACEHOLDER: EU/UK/EEA 14-day withdrawal and the “I agree to immediate
          delivery and lose withdrawal” checkbox text you use at checkout, if applicable.]
        </p>
        <p>
          [PLACEHOLDER: define when “delivery” occurs — e.g. on successful download or license grant; and
          whether streaming-only access counts as delivered.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">3. When we may issue a refund</h2>
        <p>We may provide refunds or account credits where required by law or at our discretion, including:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Duplicate charges or proven billing errors.</li>
          <li>Technical failure that prevents access and cannot be resolved within a reasonable time.</li>
          <li>Major misdescription of what was purchased (subject to verification). [PLACEHOLDER: evidence you require.]</li>
          <li>Mandatory consumer rights in your region that cannot be waived.</li>
        </ul>
        <p>[PLACEHOLDER: time window to request a refund — e.g. 7 / 14 / 30 days — and exclusions.]</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">4. Subscriptions</h2>
        <p>
          Subscription fees may renew until cancelled. If you cancel, you typically retain access until the
          end of the current billing period unless stated otherwise at purchase. [PLACEHOLDER: mid-cycle
          refunds, partial months, annual plans, and free-trial conversion rules.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">5. Chargebacks and payment disputes</h2>
        <p>
          Please contact us before filing a chargeback so we can investigate. Unfounded chargebacks may
          result in account suspension and loss of licenses where permitted. [PLACEHOLDER: appeal process.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">6. Taxes and currency</h2>
        <p>
          Refunds, if issued, are generally processed in the same currency and via the same payment method
          where possible. Tax treatment depends on local rules and processor capabilities. {P.VAT_OR_TAX_ID}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">7. How to request help</h2>
        <p>
          Email{' '}
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>{' '}
          with your transaction reference, account email, and a short description. [PLACEHOLDER: SLA and
          business hours.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">8. Changes</h2>
        <p>
          We may update this policy to reflect product, legal, or processor changes. [PLACEHOLDER: notice
          approach for material changes.]
        </p>
      </section>
    </LegalDocumentShell>
  );
}
