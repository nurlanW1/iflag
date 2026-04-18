import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata = legalPageMetadata(
  '/about',
  'About',
  `${SITE_NAME} is a digital marketplace for flag and symbol assets in vector, raster, and related formats for designers, educators, and teams.`
);

export default function AboutPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="About"
      subtitle={SITE_NAME}
      icon={<Building2 className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Operator</h2>
        <p>
          <strong>{P.TRADING_NAME}</strong> is operated by <strong>{P.OPERATOR_LEGAL_NAME}</strong> from{' '}
          <strong>{P.JURISDICTION}</strong>. We focus on clear licensing, predictable downloads, and a
          catalog structure that helps you find the right asset for presentations, apps, print, and video
          work—without overstating affiliation with any government or organization.
        </p>
        <p>
          <strong>Registered / principal address (if you publish one):</strong> {P.REGISTERED_OFFICE}.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">What we offer</h2>
        <p>
          We host a catalog of digital flag and symbol assets for creative and professional projects:
          vectors, raster images, and related media where available. Each listing shows the formats you can
          download or unlock, and the{' '}
          <Link href="/licenses" className="font-medium text-[#009ab6] hover:underline">
            licensing page
          </Link>{' '}
          explains how usage rights apply. Replace bracketed placeholders across legal documents with your
          finalized business details before publishing to customers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Trust, payments, and policies</h2>
        <p>
          Purchases may be processed by <strong>{P.PAYMENT_PROCESSOR}</strong>. For usage rights, privacy,
          refunds, and acceptable use, see:
        </p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            <Link href="/licenses" className="font-medium text-[#009ab6] hover:underline">
              Licensing &amp; usage rights
            </Link>
          </li>
          <li>
            <Link href="/privacy-policy" className="font-medium text-[#009ab6] hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/cookies" className="font-medium text-[#009ab6] hover:underline">
              Cookie Policy
            </Link>
          </li>
          <li>
            <Link href="/refunds" className="font-medium text-[#009ab6] hover:underline">
              Refund Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms-of-service" className="font-medium text-[#009ab6] hover:underline">
              Terms of Service
            </Link>
          </li>
        </ul>
        <p className="text-sm text-gray-600">
          {P.VAT_OR_TAX_ID} List regulatory registrations or industry memberships only when they are
          accurate and verifiable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Contact</h2>
        <p>
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>{' '}
          ·{' '}
          <Link href="/contact" className="font-medium text-[#009ab6] hover:underline">
            Contact form
          </Link>
        </p>
      </section>
    </LegalDocumentShell>
  );
}
