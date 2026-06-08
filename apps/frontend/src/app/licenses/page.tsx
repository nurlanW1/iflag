import Link from 'next/link';
import { FileText } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P, getPublicContactEmail } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/licenses',
  'Licensing & usage rights',
  'How digital flag assets may be used after purchase or free download on Flagswing.'
);

export default function LicensesPage() {
  const contactEmail = getPublicContactEmail();

  return (
    <LegalDocumentShell
      title="Licensing & usage rights"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<FileText className="h-8 w-8 text-[var(--brand-blue)]" aria-hidden />}
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">1. How to read this page</h2>
        <p>
          This page summarizes usage rights for digital flag assets obtained through{' '}
          <strong>{P.TRADING_NAME}</strong>. Individual assets may include additional terms shown at
          download or checkout; where they conflict, the asset-specific terms control.
        </p>
        <p>
          Flag, coat-of-arms, insignia, and government symbols may be restricted for commercial use or
          require separate permissions in some countries. <strong>You are responsible</strong> for ensuring
          your use complies with applicable law and third-party rights.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">2. Grant of license</h2>
        <p>
          When you lawfully acquire an asset (by purchase, active subscription, or free download),{' '}
          <strong>{P.OPERATOR_LEGAL_NAME}</strong> grants you a non-exclusive, non-transferable,
          worldwide license to use the asset as described in the tier below.
        </p>
        <p>
          An <em>asset</em> means a single flag or emblem file (SVG, PNG, EPS, or similar format).
          A <em>project</em> means one end product (website, app, publication, product) that you
          create and control. A <em>seat</em> means one individual user.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">3. License tiers</h2>
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5">
          <div>
            <h3 className="font-semibold text-[#2a2a2a]">Tier A — Free (flat SVG/PNG)</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-1 text-neutral-700">
              <li>Personal and commercial use in digital and print projects</li>
              <li>No attribution required</li>
              <li>May not be resold or redistributed as standalone stock assets</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#2a2a2a]">Tier B — Single asset ($3)</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-1 text-neutral-700">
              <li>Commercial use including client work and products for sale</li>
              <li>Modification and derivative works permitted for your projects</li>
              <li>License is perpetual for the purchased asset version</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#2a2a2a]">Tier C — Subscription / Bundle</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-1 text-neutral-700">
              <li>Access to all assets during active subscription period</li>
              <li>Merchandise, templates, large print runs permitted within subscription term</li>
              <li>Downloads made during active subscription may be used in completed projects after cancellation</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">4. What is generally prohibited</h2>
        <p>Unless a tier explicitly allows it, you must not:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Resell, sublicense, share, or redistribute the standalone asset or source files as stock, template, or marketplace inventory.</li>
          <li>Use automated means to bulk download or scrape the catalog outside an approved API.</li>
          <li>Use assets in trademarks, service marks, or logos where restricted by law or by the asset&apos;s notice file.</li>
          <li>Use assets in illegal, defamatory, or deceptive contexts, including misleading political advertising.</li>
          <li>Remove or obscure copyright, credit, or license notices embedded in files where required.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">5. Samples and watermarks</h2>
        <p>
          Preview or watermarked files are provided for evaluation only. A full license is required
          before using any asset in a published or distributed project.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">6. Termination</h2>
        <p>
          If access ends (subscription lapse, refund, or chargeback), your right to use new downloads
          ends immediately. Assets already incorporated into completed projects before termination may
          continue to be used in those projects. See our{' '}
          <Link href="/terms-of-service" className="font-medium text-[var(--brand-blue)] hover:underline">
            Terms of Service
          </Link>{' '}
          for full details.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">7. Warranty disclaimer</h2>
        <p>
          Except where non-waivable law requires otherwise, assets are provided &quot;as is&quot; without
          warranties of non-infringement, merchantability, or fitness for a particular purpose.
          Our total liability is limited to the amount paid for the relevant asset or subscription.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2a2a2a]">8. Contact</h2>
        <p>
          Licensing questions:{' '}
          <a className="font-medium text-[var(--brand-blue)] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </section>
    </LegalDocumentShell>
  );
}
