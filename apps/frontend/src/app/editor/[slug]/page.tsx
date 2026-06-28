import type { Metadata } from 'next';
import { countryCodeToName } from '@/lib/country-code-to-name';
import { getSiteOrigin } from '@/lib/seo/site-config';
import FlagEditorClient from './FlagEditorClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'blank') {
    const title = 'Flag Editor - Design Custom Flags Online';
    const description =
      'Use the Flagswing Flag Editor to design custom flags from a blank canvas. Add shapes, text, colors, symbols, and export PNG artwork.';
    return {
      title,
      description,
      alternates: { canonical: '/editor/blank' },
      keywords: [
        'flag editor',
        'flag maker',
        'custom flag design',
        'create flag online',
        'flag design tool',
        'flag png export',
      ],
      openGraph: {
        title,
        description,
        url: `${getSiteOrigin()}/editor/blank`,
        type: 'website',
        images: ['/og-image-v2.png'],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og-image-v2.png'],
      },
    };
  }

  const name = countryCodeToName[slug.toUpperCase()] ?? slug.toUpperCase();
  const title = `${name} Flag Editor - Add Text, Shapes & Effects`;
  const description = `Customize the ${name} flag with text, shapes, borders, colors, and effects. Create social graphics and export PNG flag artwork.`;
  return {
    title,
    description,
    alternates: { canonical: `/editor/${slug}` },
    keywords: [
      `${name} flag editor`,
      `${name} flag maker`,
      `${name} flag design`,
      `${name} flag png`,
      `${name} flag image editor`,
    ],
    openGraph: {
      title,
      description,
      url: `${getSiteOrigin()}/editor/${slug}`,
      type: 'website',
      images: ['/og-image-v2.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image-v2.png'],
    },
  };
}

export default async function FlagEditorPage({ params }: Props) {
  const { slug } = await params;
  return <FlagEditorClient slug={slug} />;
}
