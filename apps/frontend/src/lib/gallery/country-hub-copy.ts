/**
 * Country folder hub copy — DB `countries.description` first, then country + flag facts only.
 */

const FLAG_PROFILES: Record<string, { paragraphs: string[] }> = {
  UZ: {
    paragraphs: [
      'Uzbekistan is a landlocked country in Central Asia, bordered by Kazakhstan, Kyrgyzstan, Tajikistan, Afghanistan, and Turkmenistan. Ancient Silk Road cities such as Samarkand and Bukhara, Timurid heritage, and Soviet-era history shape its modern identity; the republic became independent in 1991.',
      'The national flag was adopted on 18 November 1991. It has three horizontal stripes — azure blue, white, and green — separated by thin red lines, with a white crescent and twelve stars in the canton.',
      'Blue represents the sky and Turkic cultural traditions, white peace and purity, and green nature and Islam. The red bands symbolise the vitality of the nation. The crescent reflects Muslim heritage; the twelve stars are linked to the months of the year in Uzbek tradition.',
    ],
  },
  DZ: {
    paragraphs: [
      'Algeria is the largest country in Africa by land area, with a Mediterranean coast and extensive Sahara territory. It gained independence from France in 1962 after a long liberation struggle.',
      'The Algerian flag consists of green and white vertical halves with a red crescent and star at the centre. Green stands for Islam and the land, white for purity and peace, and red for the sacrifice of martyrs. The crescent and star are emblematic devices drawn from Islamic tradition.',
    ],
  },
  BE: {
    paragraphs: [
      'Belgium is a federal monarchy in Western Europe, bordered by France, Germany, Luxembourg, and the Netherlands. Brussels is both the national capital and a centre of European governance.',
      'The Belgian flag is a vertical tricolour of black, yellow, and red, derived from the heraldic colours of the Duchy of Brabant and adopted after the revolution of 1830. It remains one of the few national flags in vertical band arrangement.',
    ],
  },
};

function humanizeRegion(region: string | null | undefined): string | null {
  const r = region?.trim();
  return r && r.length > 0 ? r : null;
}

function buildUniversalCountryParagraphs(
  name: string,
  code: string | null,
  region: string | null,
): string[] {
  const regionHuman = humanizeRegion(region);
  const intro = regionHuman
    ? `${name} is a country in ${regionHuman}.`
    : `${name} is an internationally recognised sovereign state.`;

  const parts = [intro];

  if (code) {
    parts.push(`Its ISO 3166-1 alpha-2 country code is ${code}.`);
  }

  parts.push(
    `The national flag of ${name} is the principal symbol of the state in diplomacy, public ceremony, sport, and civic life. Like most national flags, it uses colours, geometry, and emblems whose meaning is defined by law, heraldic tradition, or historical convention — often referencing independence, cultural identity, faith, or geography.`,
    `When the flag is raised on official buildings or displayed at international events, proportions and colours should follow the authorised design so the state is represented accurately.`,
  );

  return parts;
}

/**
 * Description for country hub header — country and flag only (no catalog / format marketing copy).
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
  if (db) return db;

  const code = input.isoCode?.trim().toUpperCase() || null;
  const name = input.name.trim();
  const region = humanizeRegion(input.region);
  const profile = code ? FLAG_PROFILES[code] : null;

  const parts = profile ? [...profile.paragraphs] : buildUniversalCountryParagraphs(name, code, region);

  return parts.join('\n\n');
}
