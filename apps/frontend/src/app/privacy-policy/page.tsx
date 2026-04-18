import { Shield } from 'lucide-react';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { PrivacyPolicyBody } from '@/components/legal/PrivacyPolicyBody';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { P } from '@/lib/legal/legal-placeholders';

export const metadata = legalPageMetadata(
  '/privacy-policy',
  'Privacy Policy',
  'How we collect, use, store, and protect personal data when you use this flag marketplace and related services.'
);

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentShell
      title="Privacy Policy"
      subtitle={`${P.TRADING_NAME} · ${P.JURISDICTION}`}
      icon={<Shield className="h-8 w-8 text-[#009ab6]" aria-hidden />}
    >
      <PrivacyPolicyBody />
    </LegalDocumentShell>
  );
}
