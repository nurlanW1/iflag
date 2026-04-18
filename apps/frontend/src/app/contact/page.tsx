import ContactForm from '@/components/contact/ContactForm';
import { legalPageMetadata } from '@/lib/legal/legal-page-metadata';

export const metadata = legalPageMetadata(
  '/contact',
  'Contact',
  'Contact the marketplace operator for support, privacy requests, billing questions, and legal notices.'
);

export default function ContactPage() {
  return <ContactForm />;
}
