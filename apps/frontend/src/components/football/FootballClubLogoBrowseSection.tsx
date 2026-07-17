'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Flag, Search, Trophy } from 'lucide-react';

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

type LogoGroup = {
  key: string;
  country: string;
  league: string;
  clubs: ClubLogo[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function groupClubLogos(clubs: ClubLogo[]): LogoGroup[] {
  const groups = new Map<string, LogoGroup>();

  for (const club of clubs) {
    const key = `${club.country}__${club.league}`;
    const existing = groups.get(key);
    if (existing) {
      existing.clubs.push(club);
    } else {
      groups.set(key, {
        key,
        country: club.country,
        league: club.league,
        clubs: [club],
      });
    }
  }

  return [...groups.values()].sort(
    (a, b) => a.country.localeCompare(b.country) || a.league.localeCompare(b.league),
  );
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

  const groupedClubs = useMemo(() => groupClubLogos(visibleClubs), [visibleClubs]);

  return (
    <section aria-labelledby="football-club-logo-heading" className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(36rem,0.9fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Club logo gallery</p>
            <h2 id="football-club-logo-heading" className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              Football logos
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Small logo gallery separated by country and league, with direct free downloads.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
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
                  placeholder="Club or league"
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
      ) : groupedClubs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-5 py-12 text-center text-sm text-neutral-500">
          No football club logos found.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedClubs.map((group) => (
            <section key={group.key} aria-label={`${group.country} ${group.league}`} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-2">
                <div>
                  <h3 className="text-base font-semibold text-neutral-950">{group.country}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-neutral-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5">
                      <Trophy size={12} aria-hidden />
                      {group.league}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                      <Flag size={12} aria-hidden />
                      {group.clubs.length} logos
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {group.clubs.map((club) => (
                  <article
                    key={`${club.id}-${club.logoUrl}`}
                    className="rounded-lg border border-neutral-200 bg-white p-3 text-center shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="mx-auto flex h-24 w-full items-center justify-center rounded-md bg-neutral-50 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={club.logoUrl}
                        alt={`${club.name} football club logo`}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="mt-2 truncate text-xs font-semibold text-neutral-950" title={club.name}>{club.name}</h4>
                    <a
                      href={club.downloadUrl || club.logoUrl}
                      className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-neutral-950 px-2 text-[11px] font-semibold text-white transition hover:bg-blue-600"
                    >
                      <Download size={13} aria-hidden />
                      Download
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
