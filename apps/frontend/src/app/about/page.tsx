import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata = legalPageMetadata(
  '/about',
  'About',
  `About ${SITE_NAME}: a digital marketplace for flag and symbol assets. Operator details are marked as customizable placeholders.`
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
          <strong>{P.JURISDICTION}</strong>. [PLACEHOLDER: one-paragraph company story — mission, history,
          and what makes your catalog unique. Avoid inventing awards, customer counts, or registrations.]
        </p>
        <p>
          <strong>Registered / principal address (if you publish one):</strong> {P.REGISTERED_OFFICE}.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">What we offer</h2>
        <p>
          We host a catalog of digital flag and symbol assets for creative and professional projects — for
          example vectors, raster images, or related media, subject to each item’s license. [PLACEHOLDER:
          describe formats, update cadence, and any editorial standards.]
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
            <Link href="/privacy" className="font-medium text-[#009ab6] hover:underline">
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
            <Link href="/terms" className="font-medium text-[#009ab6] hover:underline">
              Terms of Service
            </Link>
          </li>
        </ul>
        <p className="text-sm text-gray-600">
          {P.VAT_OR_TAX_ID} [PLACEHOLDER: add regulatory or industry memberships only if true and verifiable.]
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
