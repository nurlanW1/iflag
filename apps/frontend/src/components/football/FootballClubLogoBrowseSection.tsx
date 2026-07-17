'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Search, Shield, Trophy } from 'lucide-react';

type ClubLogo = {
  id: string;
  name: string;
  league: string;
  country: string;
  logoUrl: string;
  fileKey?: string;
  downloadUrl?: string;
};

type ClubsResponse = {
  clubs?: ClubLogo[];
  count?: number;
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function FootballClubLogoBrowseSection() {
  const [clubs, setClubs] = useState<ClubLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('all');
  const [league, setLeague] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/vs-designer/clubs', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() as Promise<ClubsResponse> : { clubs: [] }))
      .then((data) => {
        if (active) setClubs(Array.isArray(data.clubs) ? data.clubs : []);
      })
      .catch(() => {
        if (active) setClubs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const countries = useMemo(() => uniqueSorted(clubs.map((club) => club.country)), [clubs]);
  const leagues = useMemo(
    () => uniqueSorted(
      clubs
        .filter((club) => country === 'all' || club.country === country)
        .map((club) => club.league),
    ),
    [clubs, country],
  );

  const visibleClubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clubs.filter((club) => {
      if (country !== 'all' && club.country !== country) return false;
      if (league !== 'all' && club.league !== league) return false;
      if (!q) return true;
      return (
        club.name.toLowerCase().includes(q) ||
        club.country.toLowerCase().includes(q) ||
        club.league.toLowerCase().includes(q)
      );
    });
  }, [clubs, country, league, query]);

  return (
    <section aria-labelledby="football-club-logo-heading">
      <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Free PNG logos</p>
            <h2 id="football-club-logo-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#2a2a2a]">
              Browse football club logos by country and league
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
              Logos uploaded to R2 under <code className="rounded bg-neutral-100 px-1.5 py-0.5">football-clubs/</code> are available here for free download.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[42rem]">
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Country</span>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setLeague('all');
                }}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-800 outline-none focus:border-blue-500"
              >
                <option value="all">All countries</option>
                {countries.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">League</span>
              <select
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-800 outline-none focus:border-blue-500"
              >
                <option value="all">All leagues</option>
                {leagues.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Search</span>
              <span className="relative block">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Club, league..."
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-blue-500"
                />
              </span>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-neutral-400">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-[var(--brand-blue)]" />
          Loading football club logos...
        </div>
      ) : visibleClubs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-5 py-12 text-center text-sm text-neutral-500">
          No football club logos found. Upload PNG files under <strong>football-clubs/country/league/</strong> in R2.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleClubs.map((club) => (
            <article key={`${club.id}-${club.logoUrl}`} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_center,#ffffff_0%,#f4f4f5_76%)] p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={club.logoUrl} alt={`${club.name} football club logo`} className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
              <div className="space-y-3 border-t border-neutral-100 p-4">
                <div>
                  <h3 className="truncate text-sm font-semibold text-neutral-950">{club.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-medium text-neutral-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5">
                      <Shield size={11} aria-hidden />
                      {club.country}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                      <Trophy size={11} aria-hidden />
                      {club.league}
                    </span>
                  </div>
                </div>
                <a
                  href={club.downloadUrl || club.logoUrl}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-blue)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--brand-blue-hover)]"
                >
                  <Download size={14} aria-hidden />
                  Free download
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
