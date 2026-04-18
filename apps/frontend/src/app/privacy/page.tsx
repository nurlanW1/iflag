import { permanentRedirect } from 'next/navigation';

export default function LegacyPrivacyPageRedirect() {
  permanentRedirect('/privacy-policy');
}
