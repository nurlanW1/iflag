import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | Flagswing',
  description:
    'Answers about downloading flags, licensing, billing, and technical questions at Flagswing.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
