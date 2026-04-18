import Link from 'next/link';
import { Scale } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/terms',
  'Terms of Service',
  'Terms governing use of this digital marketplace, purchases, subscriptions, and acceptable use. Template with customizable placeholders.'
);

export default function TermsPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="Terms of Service"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<Scale className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">1. Agreement</h2>
        <p>
          These Terms of Service (“Terms”) govern access to and use of <strong>{P.TRADING_NAME}</strong>{' '}
          (the “Service”) operated by <strong>{P.OPERATOR_LEGAL_NAME}</strong> (“we”, “us”). By using the
          Service, you agree to these Terms and our{' '}
          <Link href="/privacy" className="font-medium text-[#009ab6] hover:underline">
            Privacy Policy
          </Link>
          ,{' '}
          <Link href="/refunds" className="font-medium text-[#009ab6] hover:underline">
            Refund Policy
          </Link>
          , and{' '}
          <Link href="/licenses" className="font-medium text-[#009ab6] hover:underline">
            Licensing / Usage Rights
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600">Effective date: {P.EFFECTIVE_DATE}.</p>
        <p>
          [PLACEHOLDER: add “clickwrap” reference if users must accept on signup/checkout; link to archived
          versions if you maintain them.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">2. Eligibility and accounts</h2>
        <p>
          You must meet the minimum age and capacity requirements in your jurisdiction. You are responsible
          for account credentials and for all activity under your account. [PLACEHOLDER: business accounts,
          seat limits, and admin roles if applicable.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">3. The Service</h2>
        <p>
          The Service is an online marketplace for digital assets (e.g. graphics, media, or related
          content). We may modify features, retire offerings, or suspend access for maintenance, security,
          or legal reasons.
        </p>
        <p>
          [PLACEHOLDER: describe whether you host third-party sellers, user uploads, or only first-party
          catalog; marketplace fees; and moderation approach.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">4. Orders, pricing, and taxes</h2>
        <p>
          Prices, currencies, and taxes are displayed at checkout where applicable. {P.VAT_OR_TAX_ID}{' '}
          [PLACEHOLDER: explain whether prices are inclusive or exclusive of tax; invoicing; B2B reverse
          charge.]
        </p>
        <p>
          Payments may be processed by <strong>{P.PAYMENT_PROCESSOR}</strong>. Your use of payment services
          is also subject to their terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">5. Subscriptions and renewals</h2>
        <p>
          If you purchase a subscription, it may renew automatically until cancelled in accordance with the
          renewal terms shown at purchase. [PLACEHOLDER: renewal cadence, cancellation cut-offs, proration,
          free trials, and grace periods.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">6. License to digital goods</h2>
        <p>
          When you lawfully acquire content through the Service, we grant you the usage rights described in
          our{' '}
          <Link href="/licenses" className="font-medium text-[#009ab6] hover:underline">
            Licensing / Usage Rights
          </Link>{' '}
          page and any license terms presented at download/checkout. If there is a conflict, the
          asset-specific terms control for that asset.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Violate law or third-party rights, including intellectual property and publicity rights.</li>
          <li>Use the Service to distribute malware, spam, or deceptive content.</li>
          <li>Attempt to bypass security, rate limits, paywalls, or licensing controls.</li>
          <li>Scrape or harvest data at scale without permission. [PLACEHOLDER: define permitted API use.]</li>
          <li>Use assets in ways that imply government, military, or organizational endorsement where prohibited.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">8. User content</h2>
        <p>
          If you upload or submit content, you grant us the license needed to host, display, and distribute
          it as part of operating the Service. [PLACEHOLDER: content license grant, moral rights waiver
          where permissible, and takedown process.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">9. Intellectual property notices</h2>
        <p>
          We respect intellectual property. [PLACEHOLDER: DMCA / EU e-Commerce / local notice-and-takedown
          agent name, address, and email; repeat infringer policy.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">10. Disclaimers</h2>
        <p>
          The Service and content are provided “as is” and “as available”. To the fullest extent permitted
          by law, we disclaim implied warranties of merchantability, fitness for a particular purpose, and
          non-infringement. [PLACEHOLDER: jurisdiction-specific disclaimers — some regions limit disclaimers
          for consumers.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">11. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, our aggregate liability arising out of the Service will not
          exceed the greater of (a) the amounts you paid to us for the Service in the three (3) months before
          the event giving rise to liability or (b) [PLACEHOLDER: minimum cap if different]. We are not
          liable for indirect, incidental, special, consequential, or punitive damages.
        </p>
        <p>[PLACEHOLDER: carve-outs for death/personal injury caused by negligence where non-waivable.]</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">12. Indemnity</h2>
        <p>
          You will defend and indemnify us against claims arising from your misuse of the Service, your
          content, or your violation of these Terms, subject to [PLACEHOLDER: limitations for consumers].{' '}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">13. Suspension and termination</h2>
        <p>
          We may suspend or terminate access for breach, risk, or legal requirements. You may close your
          account as described in help documentation. [PLACEHOLDER: effect on licenses already granted —
          typically survive for lawfully acquired copies subject to license terms.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">14. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of <strong>{P.JURISDICTION}</strong>, without regard to
          conflict-of-law rules. [PLACEHOLDER: exclusive venue, arbitration, class-action waiver, and
          consumer-mandatory forum rules — have counsel validate.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">15. General</h2>
        <p>
          These Terms constitute the entire agreement regarding the Service and supersede prior understandings
          on this subject. If a provision is unenforceable, the remainder remains in effect. Failure to
          enforce a provision is not a waiver.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">16. Contact</h2>
        <p>
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . [PLACEHOLDER: registered office for legal service if required: {P.REGISTERED_OFFICE}.]
        </p>
      </section>
    </LegalDocumentShell>
  );
}
