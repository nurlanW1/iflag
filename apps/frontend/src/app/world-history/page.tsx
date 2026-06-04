import type { Metadata } from 'next';
import { WorldHistoryClient } from './WorldHistoryClient';
import { SITE_NAME } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: `World Flag History Map — Interactive | ${SITE_NAME}`,
  description: 'Explore how world flags changed through history with our interactive map. From empires to modern nations — 1900 to 2024.',
  alternates: { canonical: '/world-history' },
};

export default function WorldHistoryPage() {
  return <WorldHistoryClient />;
}
