import clubLogoManifest from '@/data/football-club-logo-keys.json';
import { getPublicR2FileUrl, listR2Objects } from '@/lib/server/cloudflare-r2';
import type { FootballTeam } from '@/lib/sport-logos';

const CLUB_PREFIX = 'football-clubs/';
const MAX_CLUB_LOGOS = 20000;
const LOGO_EXTENSIONS = new Set(['png', 'webp', 'jpg', 'jpeg', 'svg']);
const COUNTRY_SORT_PRIORITY = ['England', 'Spain'];

export type FootballClubLogo = FootballTeam & {
  slug: string;
  fileKey: string;
  downloadUrl: string;
  detailUrl: string;
};

function titleCaseSegment(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => {
      if (/^(ac|as|cf|fc|fk|if|nk|rc|sc|sk|sl|ss|sv|tsg|vfl)$/i.test(part)) {
        return part.toUpperCase();
      }
      if (/^(psg|psv|rb)$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

function cleanClubSlug(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/\.football-logos\.cc$/i, '')
    .replace(/\.football-logos$/i, '')
    .replace(/\.logo$/i, '')
    .replace(/\.logos$/i, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function countrySortRank(country: string): number {
  const index = COUNTRY_SORT_PRIORITY.findIndex((item) => item.toLowerCase() === country.toLowerCase());
  return index === -1 ? COUNTRY_SORT_PRIORITY.length : index;
}

function compareFootballClubs(a: FootballClubLogo, b: FootballClubLogo): number {
  return (
    countrySortRank(a.country) - countrySortRank(b.country) ||
    a.country.localeCompare(b.country) ||
    a.league.localeCompare(b.league) ||
    a.name.localeCompare(b.name)
  );
}

function loadManifestKeys(): string[] {
  return Array.isArray(clubLogoManifest.keys)
    ? clubLogoManifest.keys.filter((key): key is string => typeof key === 'string')
    : [];
}

export function footballClubSlugFromParts(countrySlug: string, leagueSlug: string, clubSlug: string): string {
  return [countrySlug, leagueSlug, clubSlug]
    .filter(Boolean)
    .join('-')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function buildFootballClubLogoFromKey(key: string): FootballClubLogo | null {
  const normalizedKey = key.replace(/^\/+/, '');
  if (!normalizedKey.startsWith(CLUB_PREFIX) || normalizedKey.endsWith('/')) return null;

  const parts = normalizedKey.split('/').filter(Boolean);
  if (parts.length < 3) return null;

  const fileName = parts[parts.length - 1] ?? '';
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!LOGO_EXTENSIONS.has(ext)) return null;

  const publicLogoUrl = getPublicR2FileUrl(normalizedKey);
  if (!publicLogoUrl) return null;

  const countrySlug = parts[1] ?? 'clubs';
  const leagueSlug = parts.length > 3 ? parts[2] : 'football-clubs';
  const clubSlug = cleanClubSlug(fileName);
  if (!clubSlug) return null;

  const slug = footballClubSlugFromParts(countrySlug, leagueSlug, clubSlug);
  const proxyPath = `/api/vs-designer/clubs/download?path=${encodeURIComponent(normalizedKey)}`;

  return {
    id: `r2-${slug}`,
    slug,
    name: titleCaseSegment(clubSlug),
    league: leagueSlug ? titleCaseSegment(leagueSlug) : 'Football Clubs',
    country: titleCaseSegment(countrySlug),
    logoUrl: `${proxyPath}&inline=1`,
    fileKey: normalizedKey,
    downloadUrl: proxyPath,
    detailUrl: `/football-clubs/${slug}`,
  };
}

export async function listFootballClubLogos(): Promise<{ clubs: FootballClubLogo[]; source: 'r2' | 'manifest' }> {
  const liveObjects = await listR2Objects(CLUB_PREFIX, MAX_CLUB_LOGOS);
  const keys = liveObjects.length > 0 ? liveObjects.map((obj) => obj.key) : loadManifestKeys();
  const source = liveObjects.length > 0 ? 'r2' : 'manifest';
  const seen = new Set<string>();
  const clubs: FootballClubLogo[] = [];

  for (const key of keys) {
    const club = buildFootballClubLogoFromKey(key);
    if (!club) continue;
    if (seen.has(club.slug)) continue;
    seen.add(club.slug);
    clubs.push(club);
  }

  clubs.sort(compareFootballClubs);
  return { clubs, source };
}

export async function getFootballClubLogoBySlug(slug: string): Promise<FootballClubLogo | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const { clubs } = await listFootballClubLogos();
  return clubs.find((club) => club.slug === normalized) ?? null;
}
