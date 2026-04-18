import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: 'Sign in',
  description: `Sign in to your ${SITE_NAME} account.`,
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
