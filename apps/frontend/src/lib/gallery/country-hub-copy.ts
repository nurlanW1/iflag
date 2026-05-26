/**
 * Country folder hub copy — DB `countries.description` first, then curated / template fallbacks.
 */

const FLAG_FACTS: Record<string, string> = {
  DZ: 'The Algerian flag uses green and white bands with a red crescent and star — symbols referenced in the national emblem since independence. Green stands for Islam and the land, white for purity, and red for the sacrifices of the struggle for freedom.',
  UZ: 'The flag of Uzbekistan features horizontal blue, white, and green stripes with thin red borders, a white crescent, and twelve stars. Blue reflects the sky and water, white peace, green nature, and the stars the months of the year.',
  BE: 'The Belgian flag is a vertical tricolour of black, yellow, and red — one of the few national flags using vertical bands. The colours come from the Duchy of Brabant coat of arms.',
  US: 'The United States flag bears thirteen stripes and fifty stars, representing the original colonies and current states. It is one of the most widely recognized national symbols in the world.',
  TR: 'The Turkish flag is red with a white crescent and star. The design derives from Ottoman tradition and was adopted for the Republic of Turkey.',
  FR: 'The French tricolour — blue, white, and red — dates to the Revolution. It remains a standard reference for vertical three-band national flags.',
  DE: 'Germany’s flag is a horizontal tricolour of black, red, and gold (yellow). The modern arrangement was readopted after reunification in 1990.',
  GB: 'The Union Jack combines the crosses of England, Scotland, and Ireland. It is flown as the national flag of the United Kingdom.',
  PK: 'Pakistan’s flag is green with a white vertical stripe, crescent, and star. Green represents Islam and the majority Muslim population; white religious minorities and peace.',
};

function humanizeRegion(region: string | null | undefined): string | null {
  const r = region?.trim();
  return r && r.length > 0 ? r : null;
}

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
  if (db) return db;

  const code = input.isoCode?.trim().toUpperCase() || null;
  const name = input.name.trim();
  const region = humanizeRegion(input.region);

  const fact = code ? FLAG_FACTS[code] : null;
  const parts: string[] = [];

  if (fact) {
    parts.push(fact);
  } else {
    parts.push(
      `${name} is listed in our catalog with downloadable flag artwork for print, web, and design projects.`,
    );
    if (code) {
      parts.push(`ISO country code: ${code}.`);
    }
  }

  if (region) {
    parts.push(`Geographic hub: ${region}.`);
  }

  const designs = Math.max(0, input.designCount);
  const files = Math.max(0, input.fileCount);
  const slugLabel = input.slug.trim() || name.toLowerCase().replace(/\s+/g, '-');
  parts.push(
    `This folder groups ${designs} design${designs === 1 ? '' : 's'} across ${files} published file${files === 1 ? '' : 's'}. Open a tile below to pick formats (vector and raster). Files named only with the country name (for example “${slugLabel}”) are free official flat flags; creative layouts such as sphere, wave, or mockup styles are premium catalog designs.`,
  );

  return parts.join(' ');
}
