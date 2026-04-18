import Link from 'next/link';
import { FileText } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/licenses',
  'Licensing & usage rights',
  'How digital assets may be used after purchase or subscription. Template with customizable placeholders — not legal advice.'
);

export default function LicensesPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="Licensing & usage rights"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<FileText className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">1. How to read this page</h2>
        <p>
          This page summarizes usage rights for content obtained through <strong>{P.TRADING_NAME}</strong>.
          It is a <strong>template for your counsel to finalize</strong>. Individual assets may ship with
          additional terms shown at download or checkout; where they conflict, the asset-specific terms
          control for that asset.
        </p>
        <p>
          Flag, coat-of-arms, insignia, and government symbols may be restricted for commercial use or
          require separate permissions in some countries. <strong>You are responsible</strong> for ensuring
          your use complies with applicable law and third-party rights. [PLACEHOLDER: link to any symbol
          usage guidelines you publish.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">2. Grant of license</h2>
        <p>
          When you lawfully acquire an asset (for example by purchase, subscription entitlement, or
          no-charge download where offered), <strong>{P.OPERATOR_LEGAL_NAME}</strong> grants you a
          non-exclusive, non-transferable (unless expressly stated otherwise) license to use the asset as
          described in the tier you selected.
        </p>
        <p>[PLACEHOLDER: define “asset”, “project”, “end product”, and “seat” for your product.]</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">3. License tiers (customize)</h2>
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
          <div>
            <h3 className="font-semibold text-gray-900">Tier A — [PLACEHOLDER: e.g. Personal / preview]</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-1 text-gray-800">
              <li>[PLACEHOLDER: personal, non-commercial, or limited commercial scope]</li>
              <li>[PLACEHOLDER: attribution requirement yes/no]</li>
              <li>[PLACEHOLDER: caps on impressions, copies, or distribution]</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tier B — [PLACEHOLDER: e.g. Professional]</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-1 text-gray-800">
              <li>[PLACEHOLDER: commercial use in client work / products for sale]</li>
              <li>[PLACEHOLDER: modification and derivative works allowed or restricted]</li>
              <li>[PLACEHOLDER: indemnities or warranty disclaimers specific to commercial use]</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tier C — [PLACEHOLDER: e.g. Extended / broadcast]</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-1 text-gray-800">
              <li>[PLACEHOLDER: merchandise, templates, large print runs, broadcast, or OEM uses]</li>
              <li>[PLACEHOLDER: require extended license purchase]</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">4. What is generally prohibited</h2>
        <p>Unless a tier explicitly allows it, you must not:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Resell, sublicense, share, or redistribute the standalone asset or source files as stock, template, or marketplace inventory.</li>
          <li>Use automated means to bulk download or scrape the catalog outside an approved API. [PLACEHOLDER: API terms link.]</li>
          <li>Use assets in trademarks, service marks, or logos where restricted by law or by the asset’s notice file.</li>
          <li>Use assets in illegal, defamatory, or deceptive contexts, including misleading political advertising. [PLACEHOLDER: ad policy link for future review programs.]</li>
          <li>Remove or obscure copyright, credit, or license notices embedded in files where required.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">5. Third-party and user-generated content</h2>
        <p>
          Some catalog items may incorporate third-party materials or community submissions. [PLACEHOLDER:
          representations/warranties; repeat infringer policy; and how buyers are notified of UGC risks.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">6. Samples and watermarks</h2>
        <p>
          Preview or watermarked files may be provided for evaluation only. [PLACEHOLDER: whether previews
          may be used in mockups publicly, and when a full license is required.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">7. Termination</h2>
        <p>
          If access ends (for example subscription lapse or refund/chargeback), your right to use new
          downloads may end immediately and your right to continue using previously downloaded assets may be
          limited as stated in your{' '}
          <Link href="/terms-of-service" className="font-medium text-[#009ab6] hover:underline">
            Terms
          </Link>{' '}
          or checkout terms. [PLACEHOLDER: clarify survival for paid perpetual licenses if offered.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">8. Warranty disclaimer</h2>
        <p>
          Except where non-waivable law requires otherwise, assets are provided “as is” without warranties
          of non-infringement, merchantability, or fitness for a particular purpose. [PLACEHOLDER: cap on
          liability consistent with your Terms.]
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">9. Contact</h2>
        <p>
          Licensing questions:{' '}
          <a className="font-medium text-[#009ab6] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . [PLACEHOLDER: enterprise licensing inbox.]
        </p>
      </section>
    </LegalDocumentShell>
  );
}
