import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, Shield, Trophy } from 'lucide-react';
import { CategoryStockSection } from '@/components/flags/CategoryStockSection';
import { getFootballClubLogoBySlug } from '@/lib/football-clubs';
import { getSiteOrigin, SITE_NAME } from '@/lib/seo/site-config';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = await getFootballClubLogoBySlug(slug);
  if (!club) return { title: 'Football club logo not found' };

  const title = `${club.name} logo download`;
  const description = `Download the ${club.name} football club logo and browse related stock logo assets from Shutterstock, Pixabay and Pexels.`;
  const canonical = `/football-clubs/${club.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${club.name} logo | ${SITE_NAME}`,
      description,
      url: `${getSiteOrigin()}${canonical}`,
      images: [{ url: `${getSiteOrigin()}${club.logoUrl}`, alt: `${club.name} football club logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${club.name} logo | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function FootballClubLogoPage({ params }: Props) {
  const { slug } = await params;
  const club = await getFootballClubLogoBySlug(slug);
  if (!club) notFound();

  const stockQuery = `${club.name} football club logo crest`;

  return (
    <main className="marketplace-shell py-10 sm:py-12">
      <Link
        href="/categories/football-clubs"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-neutral-950"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to football logos
      </Link>

      <section className="grid gap-8 border-b border-neutral-200 pb-10 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:items-center">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex aspect-square items-center justify-center rounded-xl bg-neutral-50 p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={club.logoUrl}
              alt={`${club.name} football club logo`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Football club logo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">{club.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            Download this club logo from Flagswing, then browse related stock logo and football crest assets below.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">
              <Shield size={14} aria-hidden />
              {club.country}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              <Trophy size={14} aria-hidden />
              {club.league}
            </span>
          </div>
          <a
            href={club.downloadUrl}
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <Download size={17} aria-hidden />
            Download logo
          </a>
        </div>
      </section>

      <CategoryStockSection
        categoryName={`${club.name} football club logo`}
        categoryKind="football_clubs"
        searchQuery={stockQuery}
      />
    </main>
  );
}
