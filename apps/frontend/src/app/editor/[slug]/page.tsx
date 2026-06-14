import type { Metadata } from 'next';
import { countryCodeToName } from '@/lib/country-code-to-name';
import FlagEditorClient from './FlagEditorClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = countryCodeToName[slug.toUpperCase()] ?? slug.toUpperCase();
  return {
    title: `${name} Flag Editor — Add Text & Effects | Flagswing`,
    description: `Customize the ${name} flag with text, shapes, borders, and effects. Free preview, HD PNG export available.`,
  };
}

export default async function FlagEditorPage({ params }: Props) {
  const { slug } = await params;
  const name = countryCodeToName[slug.toUpperCase()] ?? slug.toUpperCase();
  return <FlagEditorClient slug={slug} countryName={name} />;
}
