/**
 * Country folder hub copy — short country + flag summary only.
 */

/** Cap DB/admin text so hub headers stay scannable. */
const MAX_DESCRIPTION_CHARS = 380;

const FLAG_PROFILES: Record<string, string> = {
  UZ: 'Uzbekistan lies in Central Asia and has been independent since 1991. The flag has blue, white, and green stripes with a crescent and twelve stars; the colours stand for sky, peace, nature, and national life.',
  DZ: 'Algeria is the largest African country by area, independent since 1962. Its flag is green and white with a red crescent and star — symbols of Islam, peace, and the struggle for freedom.',
  BE: 'Belgium is a federal monarchy in Western Europe; Brussels is its capital. The flag is a vertical black, yellow, and red tricolour from the Brabant heraldic tradition (since 1831).',
};

function humanizeRegion(region: string | null | undefined): string | null {
  const r = region?.trim();
  return r && r.length > 0 ? r : null;
}

function truncateAtSentence(text: string, maxChars: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= maxChars) return t;
  const slice = t.slice(0, maxChars);
  const dot = slice.lastIndexOf('.');
  if (dot >= 120) return slice.slice(0, dot + 1).trim();
  const space = slice.lastIndexOf(' ');
  if (space >= 120) return `${slice.slice(0, space).trim()}…`;
  return `${slice.trim()}…`;
}

function buildShortDescription(name: string, code: string | null, region: string | null): string {
  const profile = code ? FLAG_PROFILES[code] : null;
  if (profile) return profile;

  const regionHuman = humanizeRegion(region);
  const where = regionHuman ? ` in ${regionHuman}` : '';
  const iso = code ? ` (${code})` : '';

  return `${name}${where}${iso} is a sovereign state. Its national flag uses colours and symbols defined by national tradition — often tied to independence, culture, or faith.`;
}

/**
 * Brief description for country hub header (country + flag only).
 */
export function buildCountryHubDescription(input: {
  name: string;
  slug: string;
  isoCode: string | null;
  region: string | null;
  dbDescription: string | null;
  designCount: number;
  fileCount: number;
}): string {
  const db = input.dbDescription?.trim();
  if (db) return truncateAtSentence(db, MAX_DESCRIPTION_CHARS);

  const text = buildShortDescription(
    input.name.trim(),
    input.isoCode?.trim().toUpperCase() || null,
    humanizeRegion(input.region),
  );

  return truncateAtSentence(text, MAX_DESCRIPTION_CHARS);
}
