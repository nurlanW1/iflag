import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteOrigin } from '@/lib/seo/site-config';
import { breadcrumbJsonLd } from '@/lib/seo/structured-data';
import { FlagQuizLauncher } from './FlagQuizLauncher';

const title = 'Flag Quiz - Learn World Flags Online';
const description =
  'Play a fast world flag quiz with country flag previews from Flagswing. Practice national flags, improve recognition, and explore downloadable flag assets.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/flag-quiz' },
  keywords: [
    'flag quiz',
    'world flag quiz',
    'country flags quiz',
    'learn flags',
    'guess the flag',
    'national flags game',
    'geography quiz',
  ],
  openGraph: {
    title,
    description,
    url: `${getSiteOrigin()}/flag-quiz`,
    type: 'website',
    images: [
      {
        url: '/og-image-v2.png',
        width: 1200,
        height: 630,
        alt: 'Flagswing flag quiz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image-v2.png'],
  },
};

export default function FlagQuizPage() {
  const origin = getSiteOrigin();
  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Flagswing Flag Quiz',
    url: `${origin}/flag-quiz`,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is the flag quiz free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The Flagswing flag quiz is free to play in the browser.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I download the flags after playing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Each country flag can be explored in the Flagswing gallery with downloadable SVG, PNG, EPS, and WebP formats when available.',
        },
      },
    ],
  };

  return (
    <main className="bg-white text-neutral-950">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Flag Quiz', path: '/flag-quiz' },
          ]),
          webAppJsonLd,
          faqJsonLd,
        ]}
      />

      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Free geography game
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Flag Quiz: learn world flags faster
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
              Practice country flags with a quick visual quiz, then open the gallery to download the
              same flag assets for presentations, thumbnails, match graphics, and design work.
            </p>
            <div className="mt-7">
              <FlagQuizLauncher />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="text-lg font-bold">What you can practice</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              <li>Recognize national flags from real Flagswing previews.</li>
              <li>Improve geography memory before using assets in projects.</li>
              <li>Jump from learning to downloading SVG, PNG, EPS, and WebP flag files.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
        {[
          ['World flags', 'Practice sovereign country flags and common visual patterns.'],
          ['Design workflow', 'Use the gallery after the quiz to download matching flag assets.'],
          ['More tools', 'Create custom flags or VS matchup graphics with Flagswing tools.'],
        ].map(([heading, copy]) => (
          <article key={heading} className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-base font-bold">{heading}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{copy}</p>
          </article>
        ))}
      </section>

      <nav className="mx-auto flex max-w-[1200px] flex-wrap gap-3 px-4 pb-12 sm:px-6" aria-label="Related tools">
        <Link className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline" href="/gallery">
          Browse flag gallery
        </Link>
        <Link className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline" href="/editor/blank">
          Open Flag Editor
        </Link>
        <Link className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline" href="/vs-designer">
          Open VS Designer
        </Link>
      </nav>
    </main>
  );
}
