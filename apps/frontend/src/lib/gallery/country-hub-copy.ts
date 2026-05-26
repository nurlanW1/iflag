/**
 * Country folder hub copy — DB `countries.description` first, then curated / generated fallbacks.
 */

const FLAG_PROFILES: Record<
  string,
  { paragraphs: string[]; regionHint?: string }
> = {
  UZ: {
    regionHint: 'Central Asia',
    paragraphs: [
      'Uzbekistan is a landlocked country in Central Asia, bordered by Kazakhstan, Kyrgyzstan, Tajikistan, Afghanistan, and Turkmenistan. With a population of more than 35 million, it is one of the most populous states in the region. Its history spans ancient Silk Road cities such as Samarkand, Bukhara, and Khiva, Timurid heritage, and membership in the Soviet Union before independence in 1991.',
      'The national flag of Uzbekistan was adopted on 18 November 1991, shortly after independence. It consists of three horizontal stripes: azure blue on top, white in the centre, and green at the bottom, separated by thin red lines. In the upper hoist corner are a white crescent and twelve white five-pointed stars arranged in rows.',
      'Blue symbolises the sky and water, as well as cultural and spiritual values associated with Turkic tradition. White stands for peace and moral purity. Green represents nature, fertility, and Islam. The red bands recall the life force connecting people and the strength of the nation. The crescent reflects the historical Muslim heritage of the country, while the twelve stars refer to the months of the year and to the constellations of the Uzbek calendar tradition.',
      'The flag replaced the Soviet-era Uzbek SSR flag and became a unifying symbol of the Republic of Uzbekistan. It is flown on public buildings, at diplomatic missions, and during national holidays such as Independence Day (1 September). Designers and publishers worldwide use Uzbekistan flag artwork for maps, presentations, sports coverage, education, and branding — our catalog collects official flat files and creative variants in vector and raster formats.',
    ],
  },
  DZ: {
    paragraphs: [
      'Algeria is the largest country in Africa by area, with a long Mediterranean coastline and vast Saharan territory. Modern Algeria emerged from French colonial rule and a war of independence (1954–1962), and today it is a republic with Arabic and Berber (Tamazight) as national languages.',
      'The Algerian flag uses green and white vertical bands with a red crescent and star at the centre. Green represents Islam and the land, white purity and peace, and red the blood of martyrs who fought for independence. The crescent and star are traditional Islamic symbols and appear on the national emblem.',
      'Adopted in 1962, the design is among the clearest examples of a two-colour field with central emblematic devices. The flag is widely used in civic life, sport, and diaspora communities, and remains a strong marker of Algerian identity abroad.',
    ],
  },
  BE: {
    paragraphs: [
      'Belgium is a federal constitutional monarchy in Western Europe, bordered by France, Germany, Luxembourg, and the Netherlands. Brussels serves as the capital of Belgium and as a major seat of European Union institutions.',
      'The national flag is a vertical tricolour of black, yellow, and red. The colours are taken from the coat of arms of the Duchy of Brabant and were popularised during the Belgian Revolution of 1830. The flag was officially adopted in 1831 and is one of the few sovereign flags arranged in vertical bands.',
      'Belgium’s linguistic communities (Dutch, French, and a German-speaking minority) share the same national flag, which appears at royal ceremonies, sporting events, and public buildings throughout the country.',
    ],
  },
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
  const profile = code ? FLAG_PROFILES[code] : null;

  const parts: string[] = [];

  if (profile) {
    parts.push(...profile.paragraphs);
    if (region && profile.regionHint && region.toLowerCase() !== profile.regionHint.toLowerCase()) {
      parts.push(`In our catalog this country is grouped under the ${region} region.`);
    }
  } else {
    parts.push(
      `${name} is a sovereign state represented in the Flagswing catalog with downloadable flag artwork for print, web, education, and design workflows.`,
    );
    if (code) {
      parts.push(`ISO 3166-1 alpha-2 code: ${code}.`);
    }
    if (region) {
      parts.push(
        `${name} is listed in the ${region} regional collection alongside neighbouring countries and territories.`,
      );
    }
    parts.push(
      `National flags carry legal and cultural significance; colours and symbols often reflect history, faith, political movements, or geographic features. When using flag graphics commercially, check licence terms for your project and prefer vector masters (SVG, EPS, AI) for large-format output.`,
    );
  }

  const designs = Math.max(0, input.designCount);
  const files = Math.max(0, input.fileCount);
  const slugLabel = input.slug.trim() || name.toLowerCase().replace(/\s+/g, '-');
  parts.push(
    `This folder contains ${designs} design${designs === 1 ? '' : 's'} and ${files} published file${files === 1 ? '' : 's'}. Open a tile to choose formats. Files named only with the country name (for example “${slugLabel}”) are free official flat flags; creative styles such as sphere, wave, heart, or mockup layouts are premium catalog designs.`,
  );

  return parts.join('\n\n');
}
