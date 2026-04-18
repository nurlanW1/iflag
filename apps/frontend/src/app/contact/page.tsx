import ContactForm from '@/components/contact/ContactForm';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata = legalPageMetadata(
  '/contact',
  'Contact',
  `Contact ${SITE_NAME} for marketplace support, licensing questions, billing help, privacy requests, and legal notices.`
);

export default function ContactPage() {
  return <ContactForm />;
}
