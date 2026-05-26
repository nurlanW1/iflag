/**
 * Country folder hub copy — DB `countries.description` first, then generated long-form text for every country.
 */

const FLAG_PROFILES: Record<string, { paragraphs: string[]; regionHint?: string }> = {
  UZ: {
    regionHint: 'Central Asia',
    paragraphs: [
      'Uzbekistan is a landlocked country in Central Asia, bordered by Kazakhstan, Kyrgyzstan, Tajikistan, Afghanistan, and Turkmenistan. With a population of more than 35 million, it is one of the most populous states in the region. Its history spans ancient Silk Road cities such as Samarkand, Bukhara, and Khiva, Timurid heritage, and membership in the Soviet Union before independence in 1991.',
      'The national flag of Uzbekistan was adopted on 18 November 1991, shortly after independence. It consists of three horizontal stripes: azure blue on top, white in the centre, and green at the bottom, separated by thin red lines. In the upper hoist corner are a white crescent and twelve white five-pointed stars arranged in rows.',
      'Blue symbolises the sky and water, as well as cultural and spiritual values associated with Turkic tradition. White stands for peace and moral purity. Green represents nature, fertility, and Islam. The red bands recall the life force connecting people and the strength of the nation. The crescent reflects the historical Muslim heritage of the country, while the twelve stars refer to the months of the year and to the constellations of the Uzbek calendar tradition.',
      'The flag replaced the Soviet-era Uzbek SSR flag and became a unifying symbol of the Republic of Uzbekistan. It is flown on public buildings, at diplomatic missions, and during national holidays such as Independence Day (1 September).',
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

const REGION_CONTEXT: Record<string, string> = {
  africa:
    'As part of the African continental family of nations, this state participates in African Union forums and is represented internationally by its national symbols.',
  asia: 'Situated in Asia, the country belongs to a diverse region of republics, monarchies, and federal states whose flags reflect many distinct historical paths.',
  europe:
    'As a European state, its flag traditions intersect with heraldry, revolutionary tricolours, and modern civic republican symbolism.',
  americas:
    'In the Americas, national flags often recall independence wars, federal union, or indigenous and colonial heritage woven into republican emblems.',
  oceania:
    'In Oceania and the Pacific, flags frequently combine British or other colonial inheritances with local motifs that speak to island identity and self-determination.',
};

function humanizeRegion(region: string | null | undefined): string | null {
  const r = region?.trim();
  return r && r.length > 0 ? r : null;
}

function regionBucket(region: string | null): string | null {
  const r = (region ?? '').toLowerCase();
  if (!r) return null;
  if (r.includes('africa')) return 'africa';
  if (r.includes('asia')) return 'asia';
  if (r.includes('europe')) return 'europe';
  if (r.includes('america') || r.includes('caribbean')) return 'americas';
  if (r.includes('oceania') || r.includes('pacific')) return 'oceania';
  return null;
}

/** Long-form copy for any country without a hand-written profile. */
function buildUniversalCountryParagraphs(
  name: string,
  code: string | null,
  region: string | null,
): string[] {
  const isoBit = code ? ` It is identified internationally by ISO 3166-1 alpha-2 code ${code}.` : '';
  const regionHuman = humanizeRegion(region);
  const bucket = regionBucket(regionHuman);
  const regionIntro = bucket ? REGION_CONTEXT[bucket] : null;

  const parts: string[] = [
    `${name} is a country whose national flag is one of its most recognisable public symbols.${isoBit}${
      regionHuman
        ? ` In the Flagswing catalog it is grouped under the ${regionHuman} regional collection alongside neighbouring states.`
        : ''
    } The flag is displayed on official buildings, at diplomatic missions, during national ceremonies, in schools, and at international sporting events whenever ${name} is formally represented.`,
  ];

  if (regionIntro) {
    parts.push(regionIntro);
  }

  parts.push(
    `The flag of ${name} combines colours, stripes, crosses, crescents, stars, weapons, or coats of arms according to national law and tradition. Such elements often commemorate independence, constitutional values, cultural identity, religious heritage, or geographic features. Accurate reproduction matters for news graphics, textbooks, maps, presentations, and branding — incorrect colours or proportions can misrepresent the state.`,
    `Professional workflows typically rely on vector masters (SVG, EPS, AI, PDF) for print and signage, and on PNG or JPG for digital layouts. WebP previews on country hub pages are optimised for fast browsing; they are not substitutes for licensed downloadable production files. Creative variants in this folder (wave, sphere, circle, heart, mockup, and similar styles) are intended for premium catalog use, while files named only with the country name usually correspond to the free official flat flag.`,
  );

  return parts;
}

function catalogFooter(
  name: string,
  slug: string,
  designCount: number,
  fileCount: number,
): string {
  const slugLabel = slug.trim() || name.toLowerCase().replace(/\s+/g, '-');
  const designs = Math.max(0, designCount);
  const files = Math.max(0, fileCount);
  return `This ${name} folder contains ${designs} design${designs === 1 ? '' : 's'} and ${files} published file${files === 1 ? '' : 's'}. Open any tile below to choose formats and download. Files named only “${slugLabel}” (country name only) are free official flat flags; other layouts are premium catalog designs. Hub covers use WebP when available — without watermark — for quick preview.`;
}

/**
 * Long description for every country hub (unless admin set `countries.description`).
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

  const parts: string[] = profile ? [...profile.paragraphs] : buildUniversalCountryParagraphs(name, code, region);

  if (profile && region && profile.regionHint && region.toLowerCase() !== profile.regionHint.toLowerCase()) {
    parts.push(`Catalog region: ${region}.`);
  }

  parts.push(catalogFooter(name, input.slug, input.designCount, input.fileCount));

  return parts.join('\n\n');
}
