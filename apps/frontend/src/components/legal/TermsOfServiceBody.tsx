import Link from 'next/link';
import { P, getPublicContactEmail, getPublicContactPhoneDisplay, getPublicContactPhoneHref } from '@/lib/legal/legal-placeholders';

export function TermsOfServiceBody() {
  const contactEmail = getPublicContactEmail();
  const contactPhone = getPublicContactPhoneDisplay();
  const contactPhoneHref = getPublicContactPhoneHref();

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">1. Agreement</h2>
        <p>
          These Terms of Service (“Terms”) govern access to and use of <strong>{P.TRADING_NAME}</strong>{' '}
          (the “Service”) operated by <strong>{P.OPERATOR_LEGAL_NAME}</strong> (“we”, “us”). By using the
          Service, you agree to these Terms and our{' '}
          <Link href="/privacy-policy" className="font-medium text-[var(--brand-blue)] hover:underline">
            Privacy Policy
          </Link>
          ,{' '}
          <Link href="/refunds" className="font-medium text-[var(--brand-blue)] hover:underline">
            Refund Policy
          </Link>
          , and{' '}
          <Link href="/licenses" className="font-medium text-[var(--brand-blue)] hover:underline">
            Licensing / Usage Rights
          </Link>
          .
        </p>
        <p className="text-sm text-neutral-500">Effective date: {P.EFFECTIVE_DATE}.</p>
        <p>
          When checkout or account screens ask you to accept these Terms, the version published on this page
          applies unless a later version is shown before purchase.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">2. Eligibility and accounts</h2>
        <p>
          You must meet the minimum age and capacity requirements in your jurisdiction. You are responsible
          for account credentials and for all activity under your account. Business users are responsible for
          ensuring that their team members use downloaded assets within the published license terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">3. The Service</h2>
        <p>
          The Service is an online marketplace for digital assets (e.g. graphics, media, or related
          content). We may modify features, retire offerings, or suspend access for maintenance, security,
          fraud prevention, or legal reasons.
        </p>
        <p>
          Some pages may show third-party stock-provider results or user-imported editor content. Download and
          purchase terms are shown before access is granted.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">4. Orders, pricing, and taxes</h2>
        <p>
          Prices, currencies, and any available tax or invoice details are displayed at checkout where applicable.
        </p>
        <p>
          Payments may be processed by <strong>{P.PAYMENT_PROCESSOR}</strong>. Your use of payment services
          is also subject to their terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">5. Subscriptions and renewals</h2>
        <p>
          If you purchase a subscription, it may renew automatically until cancelled in accordance with the
          renewal terms shown at purchase. One-time VS Designer exports and individual asset purchases do not
          renew unless a checkout page clearly states otherwise.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">6. License to digital goods</h2>
        <p>
          When you lawfully acquire content through the Service, we grant you the usage rights described in
          our{' '}
          <Link href="/licenses" className="font-medium text-[var(--brand-blue)] hover:underline">
            Licensing / Usage Rights
          </Link>{' '}
          page and any license terms presented at download/checkout. If there is a conflict, the
          asset-specific terms control for that asset.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Violate law or third-party rights, including intellectual property and publicity rights.</li>
          <li>Use the Service to distribute malware, spam, or deceptive content.</li>
          <li>Attempt to bypass security, rate limits, paywalls, or licensing controls.</li>
          <li>Scrape or harvest data at scale without permission.</li>
          <li>
            Use assets in ways that imply government, military, or organizational endorsement where prohibited.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">8. User content</h2>
        <p>
          If you upload or submit content, you grant us the license needed to host, display, and distribute it
          as part of operating the Service. You remain responsible for ensuring that uploaded or imported
          content does not violate third-party rights.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">9. Intellectual property notices</h2>
        <p>
          We respect intellectual property. Send copyright, trademark, or similar notices to the contact
          details published on this site with enough information for us to identify and review the material.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">10. Disclaimers</h2>
        <p>
          The Service and content are provided “as is” and “as available”. To the fullest extent permitted
          by law, we disclaim implied warranties of merchantability, fitness for a particular purpose, and
          non-infringement. Consumer laws in your users’ countries may limit certain disclaimers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">11. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, our aggregate liability arising out of the Service will not
          exceed the amounts you paid to us for the Service in the three (3) months before the event giving rise to liability.
          We are not liable for indirect, incidental, special, consequential, or punitive damages.
        </p>
        <p>Nothing in these Terms limits liability where applicable law does not allow that limitation.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">12. Indemnity</h2>
        <p>
          You will defend and indemnify us against claims arising from your misuse of the Service, your
          content, or your violation of these Terms, subject to limitations that apply to consumers in your
          markets.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">13. Suspension and termination</h2>
        <p>
          We may suspend or terminate access for breach, risk, or legal requirements. You may close your
          account by contacting support. Licenses for copies lawfully acquired before termination remain subject
          to the license terms that applied at download or checkout.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">14. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of <strong>{P.JURISDICTION}</strong>, without regard to
          conflict-of-law rules.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">15. General</h2>
        <p>
          These Terms constitute the entire agreement regarding the Service and supersede prior understandings
          on this subject. If a provision is unenforceable, the remainder remains in effect. Failure to
          enforce a provision is not a waiver.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">16. Contact</h2>
        <p>
          <a className="font-medium text-[var(--brand-blue)] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
{' '}or call{' '}
          <a className="font-medium text-[var(--brand-blue)] hover:underline" href={contactPhoneHref}>
            {contactPhone}
          </a>
          .
        </p>
      </section>
    </>
  );
}
