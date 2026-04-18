import { Scale } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { TermsOfServiceBody } from '@/components/legal/TermsOfServiceBody';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/terms-of-service',
  'Terms of Service',
  'Terms governing use of this flag marketplace, purchases, subscriptions, licensing, and acceptable use.'
);

export default function TermsOfServicePage() {
  return (
    <LegalDocumentShell
      title="Terms of Service"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<Scale className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <TermsOfServiceBody />
    </LegalDocumentShell>
  );
}
