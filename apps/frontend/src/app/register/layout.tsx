import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: 'Create account',
  description: `Create your ${SITE_NAME} account.`,
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
