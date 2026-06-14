import type { Metadata } from 'next';
import EditorIndexClient from './EditorIndexClient';

export const metadata: Metadata = {
  title: 'Flag Editor — Customize Any Country Flag | Flagswing',
  description:
    'Add text, shapes, borders, and effects to any of 250+ country flags. Free preview, HD export available.',
};

export default function EditorIndexPage() {
  return <EditorIndexClient />;
}
