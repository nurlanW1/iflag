import { permanentRedirect } from 'next/navigation';

export default function LegacyTermsPageRedirect() {
  permanentRedirect('/terms-of-service');
}
