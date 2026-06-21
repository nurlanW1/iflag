/**
 * Five gallery continents (Olympic-style hubs) — used for `/gallery?region=…` and grouped lists.
 */

import { COUNTRIES } from '@/lib/countries';

export const GALLERY_CONTINENTS = [
  'Europe',
  'Asia',
  'Africa',
  'Americas',
  'Oceania',
] as const;

export type GalleryContinent = (typeof GALLERY_CONTINENTS)[number];

const ISO_TO_CONTINENT: Record<string, GalleryContinent> = {};
const ISO_BY_COUNTRY_SLUG = new Map(
  COUNTRIES.map((country) => [country.slug.toLowerCase(), country.code.toUpperCase()]),
);

function addContinent(continent: GalleryContinent, codes: string): void {
  for (const raw of codes.split(',')) {
    const c = raw.trim().toUpperCase();
    if (c.length === 2) ISO_TO_CONTINENT[c] = continent;
  }
}

/** UN-style macro regions (ISO 3166-1 alpha-2). */
addContinent(
  'Africa',
  'DZ,AO,BJ,BW,BF,BI,CV,CM,CF,TD,KM,CG,CD,CI,DJ,EG,GQ,ER,SZ,ET,GA,GM,GH,GN,GW,KE,LS,LR,LY,MG,MW,ML,MR,MU,MA,MZ,NA,NE,NG,RW,ST,SN,SC,SL,SO,ZA,SS,SD,TZ,TG,TN,UG,ZM,ZW,EH',
);
addContinent(
  'Americas',
  'AG,AR,BS,BB,BZ,BM,BO,BR,CA,CL,CO,CR,CU,DM,DO,EC,SV,GD,GT,GY,HT,HN,JM,MX,NI,PA,PY,PE,PR,KN,LC,VC,SR,TT,US,UY,VE,VI,GL,GF,GP,MQ,AW,CW,SX,TC,AI,MS,FK',
);
addContinent(
  'Asia',
  'AF,AM,AZ,BH,BD,BT,BN,KH,CN,GE,HK,IN,ID,IR,IQ,IL,JP,JO,KZ,KW,KG,LA,LB,MO,MY,MV,MN,MM,NP,KP,KR,OM,PK,PS,PH,QA,SA,SG,LK,SY,TW,TJ,TH,TL,TM,TR,AE,UZ,VN,YE',
);
addContinent(
  'Europe',
  'AL,AD,AT,BY,BE,BA,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IS,IE,IT,LV,LI,LT,LU,MT,MD,MC,ME,NL,NO,PL,PT,RO,RU,SM,RS,SK,SI,ES,SE,CH,UA,GB,VA,MK,FO,GI,GG,JE,IM,AX,XK',
);
addContinent(
  'Oceania',
  'AU,NZ,FJ,PG,SB,VU,NC,PF,WS,TO,KI,TV,NR,FM,MH,PW,CK,NU,AS,GU,MP,TK,WF,PN',
);

/** Aliases from home hub tiles and URLs. */
const REGION_ALIASES: Record<string, GalleryContinent> = {
  europe: 'Europe',
  asia: 'Asia',
  africa: 'Africa',
  americas: 'Americas',
  america: 'Americas',
  'north america': 'Americas',
  'south america': 'Americas',
  oceania: 'Oceania',
  australia: 'Oceania',
};

export function normalizeGalleryRegionParam(raw: string | null | undefined): GalleryContinent | null {
  const key = raw?.trim().toLowerCase() ?? '';
  if (!key) return null;
  const alias = REGION_ALIASES[key];
  if (alias) return alias;
  const titled = raw!.trim();
  if ((GALLERY_CONTINENTS as readonly string[]).includes(titled)) return titled as GalleryContinent;
  return null;
}

export function continentFromIso2(iso: string | null | undefined): GalleryContinent | null {
  const code = iso?.trim().toUpperCase();
  if (!code) return null;
  if (code === 'UK') return ISO_TO_CONTINENT.GB ?? 'Europe';
  return ISO_TO_CONTINENT[code] ?? null;
}

/** Map stored `countries.region` text (admin / legacy) onto gallery continents. */
export function continentFromStoredRegion(region: string | null | undefined): GalleryContinent | null {
  const r = region?.trim().toLowerCase() ?? '';
  if (!r) return null;
  for (const [alias, continent] of Object.entries(REGION_ALIASES)) {
    if (r === alias || r.includes(alias)) return continent;
  }
  if (r.includes('europe')) return 'Europe';
  if (r.includes('asia') || r.includes('middle east')) return 'Asia';
  if (r.includes('africa')) return 'Africa';
  if (r.includes('america') || r.includes('caribbean') || r.includes('latin')) return 'Americas';
  if (r.includes('oceania') || r.includes('australasia') || r.includes('pacific')) return 'Oceania';
  return normalizeGalleryRegionParam(region);
}

export function resolveGalleryContinent(input: {
  isoAlpha2?: string | null;
  storedRegion?: string | null;
  slug?: string | null;
}): GalleryContinent | null {
  const slugIso = input.slug ? ISO_BY_COUNTRY_SLUG.get(input.slug.trim().toLowerCase()) : null;
  return (
    continentFromStoredRegion(input.storedRegion) ??
    continentFromIso2(input.isoAlpha2) ??
    continentFromIso2(slugIso) ??
    null
  );
}

export function isoAlpha2CodesForGalleryRegion(
  region: string | GalleryContinent | null | undefined,
): string[] {
  const continent = typeof region === 'string' ? normalizeGalleryRegionParam(region) ?? (region as GalleryContinent) : region;
  if (!continent || !(GALLERY_CONTINENTS as readonly string[]).includes(continent)) return [];
  const out: string[] = [];
  for (const [iso, cont] of Object.entries(ISO_TO_CONTINENT)) {
    if (cont === continent) out.push(iso);
  }
  return out;
}

export function galleryRegionMatchesContinent(
  filterRegion: string | null | undefined,
  continent: GalleryContinent | null,
): boolean {
  const want = normalizeGalleryRegionParam(filterRegion);
  if (!want) return true;
  return continent === want;
}

export type CountryWithContinent = {
  code?: string | null;
  slug?: string | null;
  continent?: string | null;
};

export function assignContinentToCountryHub<T extends CountryWithContinent>(
  row: T,
  storedRegion?: string | null,
): T & { continent: GalleryContinent | null } {
  const continent = resolveGalleryContinent({
    isoAlpha2: row.code,
    storedRegion,
    slug: row.slug,
  });
  return { ...row, continent };
}

export function filterCountryHubsByGalleryRegion<T extends CountryWithContinent>(
  list: T[],
  filterRegion: string | null | undefined,
): T[] {
  const want = normalizeGalleryRegionParam(filterRegion);
  if (!want) return list;
  return list.filter((c) => {
    const cont =
      (c.continent as GalleryContinent | null | undefined) ??
      resolveGalleryContinent({ isoAlpha2: c.code, slug: c.slug });
    return cont === want;
  });
}

export function groupCountryHubsByContinent<T extends CountryWithContinent & { name: string }>(
  list: T[],
): Array<{ continent: GalleryContinent | 'Other'; countries: T[] }> {
  const buckets = new Map<GalleryContinent | 'Other', T[]>();
  for (const c of list) {
    const cont =
      (c.continent as GalleryContinent | null | undefined) ??
      resolveGalleryContinent({ isoAlpha2: c.code, slug: c.slug }) ??
      'Other';
    const key = cont === 'Other' ? 'Other' : cont;
    const arr = buckets.get(key) ?? [];
    arr.push(c);
    buckets.set(key, arr);
  }

  const out: Array<{ continent: GalleryContinent | 'Other'; countries: T[] }> = [];
  for (const cont of GALLERY_CONTINENTS) {
    const countries = buckets.get(cont);
    if (countries?.length) {
      countries.sort((a, b) => a.name.localeCompare(b.name));
      out.push({ continent: cont, countries });
    }
  }
  const other = buckets.get('Other');
  if (other?.length) {
    other.sort((a, b) => a.name.localeCompare(b.name));
    out.push({ continent: 'Other', countries: other });
  }
  return out;
}
