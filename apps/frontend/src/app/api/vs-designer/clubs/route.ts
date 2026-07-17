import { NextResponse } from 'next/server';
import { getPublicR2FileUrl, listR2Objects } from '@/lib/server/cloudflare-r2';
import clubLogoManifest from '@/data/football-club-logo-keys.json';
import type { FootballTeam } from '@/lib/sport-logos';

export const dynamic = 'force-dynamic';

const CLUB_PREFIX = 'football-clubs/';
const MAX_CLUB_LOGOS = 20000;
const LOGO_EXTENSIONS = new Set(['png', 'webp', 'jpg', 'jpeg', 'svg']);

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

function loadManifestKeys(): string[] {
  return Array.isArray(clubLogoManifest.keys)
    ? clubLogoManifest.keys.filter((key): key is string => typeof key === 'string')
    : [];
}

function buildClubFromKey(key: string): FootballTeam | null {
  const normalizedKey = key.replace(/^\/+/, '');
  if (!normalizedKey.startsWith(CLUB_PREFIX) || normalizedKey.endsWith('/')) return null;

  const parts = normalizedKey.split('/').filter(Boolean);
  if (parts.length < 3) return null;

  const fileName = parts[parts.length - 1] ?? '';
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!LOGO_EXTENSIONS.has(ext)) return null;

  const logoUrl = getPublicR2FileUrl(normalizedKey);
  if (!logoUrl) return null;

  const countrySlug = parts[1] ?? 'clubs';
  const leagueSlug = parts.length > 3 ? parts[2] : '';
  const clubSlug = cleanClubSlug(fileName);
  if (!clubSlug) return null;

  return {
    id: `r2-${parts.slice(1).join('-').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`,
    name: titleCaseSegment(clubSlug),
    league: leagueSlug ? titleCaseSegment(leagueSlug) : 'Football Clubs',
    country: titleCaseSegment(countrySlug),
    logoUrl,
    fileKey: normalizedKey,
    downloadUrl: `/api/vs-designer/clubs/download?path=${encodeURIComponent(normalizedKey)}`,
  };
}

export async function GET() {
  const liveObjects = await listR2Objects(CLUB_PREFIX, MAX_CLUB_LOGOS);
  const keys = liveObjects.length > 0 ? liveObjects.map((obj) => obj.key) : loadManifestKeys();
  const seen = new Set<string>();
  const clubs: FootballTeam[] = [];

  for (const key of keys) {
    const club = buildClubFromKey(key);
    if (!club) continue;
    const dedupeKey = `${club.country.toLowerCase()}|${club.name.toLowerCase()}|${club.logoUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    clubs.push(club);
  }

  clubs.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  return NextResponse.json(
    { clubs, count: clubs.length, source: liveObjects.length > 0 ? 'r2' : 'manifest' },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
