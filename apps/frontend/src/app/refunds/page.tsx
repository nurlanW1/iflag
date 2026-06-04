import Link from 'next/link';
import { Banknote } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/refunds',
  'Refund Policy',
  'Refunds, cancellations, and billing disputes for digital flag assets and subscriptions on Flagswing.'
);

export default function RefundsPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="Refund Policy"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<Banknote className="h-8 w-8 text-[#2563eb]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">1. Overview</h2>
        <p>
          This Refund Policy explains how cancellations, refunds, and billing disputes work for purchases
          made through <strong>{P.TRADING_NAME}</strong>, operated by{' '}
          <strong>{P.OPERATOR_LEGAL_NAME}</strong>. It supplements our{' '}
          <Link href="/terms-of-service" className="font-medium text-[#2563eb] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600">Effective date: {P.EFFECTIVE_DATE}.</p>
        <p>
          Payments are processed by <strong>{P.PAYMENT_PROCESSOR}</strong>. Their dispute and chargeback
          rules may also apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">2. Digital goods</h2>
        <p>
          Digital assets are delivered instantly upon successful payment. By completing your purchase
          you agree to immediate delivery and acknowledge that this may limit withdrawal rights under
          consumer protection law in your jurisdiction (e.g. EU/UK 14-day right of withdrawal).
        </p>
        <p>
          &quot;Delivery&quot; occurs when the download link or presigned URL is made available, or when
          access is granted via subscription — whichever comes first.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">3. When we may issue a refund</h2>
        <p>We may provide refunds or account credits where required by law or at our discretion, including:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Duplicate charges or proven billing errors.</li>
          <li>Technical failure that prevents access and cannot be resolved within 48 hours.</li>
          <li>Major misdescription of what was purchased (please email us with your order reference and a description of the issue).</li>
          <li>Mandatory consumer rights in your region that cannot be waived.</li>
        </ul>
        <p>Refund requests must be submitted within <strong>14 days</strong> of the original charge. Requests after this window are evaluated at our discretion.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">4. Subscriptions</h2>
        <p>
          Subscriptions renew automatically until cancelled. If you cancel, you retain access until
          the end of the current billing period. No partial-month or mid-cycle refunds are issued
          unless required by law. Annual plans may be refunded within 14 days of the renewal date if
          you have not downloaded any assets in that period.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">5. Chargebacks and payment disputes</h2>
        <p>
          Please contact us before filing a chargeback so we can resolve the issue quickly. Unfounded
          chargebacks may result in account suspension and loss of licenses. To appeal a suspension,
          email us with your order reference.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">6. Taxes and currency</h2>
        <p>
          Refunds, if issued, are processed in the original payment currency via the same payment method
          where possible. Tax treatment depends on local rules and processor capabilities.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">7. How to request help</h2>
        <p>
          Email{' '}
          <a className="font-medium text-[#2563eb] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>{' '}
          with your transaction reference, account email, and a short description of the issue.
          We aim to respond within 2 business days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">8. Changes</h2>
        <p>
          We may update this policy to reflect product, legal, or processor changes. Material changes
          will be announced via email or a prominent notice on the site at least 7 days before they
          take effect.
        </p>
      </section>
    </LegalDocumentShell>
  );
}
