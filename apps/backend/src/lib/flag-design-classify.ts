/**
 * Classify uploaded / imported flag files into design types & pricing tier.
 *
 * Product rules:
 * - Filename stem is **only** the country name (e.g. `USA`, `uzbekistan`, `algeria`) → free official
 * - Any extra token (`USA_flag`, `USA_vector_file`, `flag uzbekistan`) → paid
 * - WebP = preview/cover only (not a downloadable master)
 */

import { isFlagVideoFormat } from './flag-video-formats.js';

export type FlagDesignType =
  | 'official_flat'
  | 'wave'
  | 'circle'
  | 'heart'
  | 'sphere'
  | 'map'
  | 'mockup'
  | 'banner'
  | 'icon_pack'
  | 'video'
  | 'other';

/** Raster optimized for hub covers & gallery thumbnails — never sold/downloaded as master. */
export const PREVIEW_ONLY_FORMATS = new Set(['webp']);

export function isPreviewOnlyFormat(format: string | null | undefined): boolean {
  const f = (format ?? '').trim().toLowerCase();
  return f.length > 0 && PREVIEW_ONLY_FORMATS.has(f);
}

const CREATIVE_SUBSTRINGS = [
  'wave',
  'circle',
  'heart',
  'sphere',
  '/map/',
  '-map_',
  '_map_',
  'flag-map',
  '3d',
  'icon-pack',
  'iconpack',
  '/icons',
  'brush',
  'grunge',
  'background',
  'banner',
  'mockup',
  'video',
];

/** ISO-2 → common filename stems users upload (e.g. `USA.png` for United States). */
const ISO_COLLOQUIAL: Record<string, string[]> = {
  us: ['usa', 'america', 'unitedstates'],
  gb: ['uk', 'gbr', 'britain', 'greatbritain', 'unitedkingdom'],
  ae: ['uae', 'emirates'],
  kr: ['korea', 'southkorea'],
  kp: ['northkorea', 'dprk'],
  cz: ['czechia', 'czech'],
};

function norm(s: string): string {
  return s.toLowerCase().replace(/_/g, ' ');
}

function compactAlphanumeric(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * True when the stem contains separators or multiple words (`USA_flag`, `USA-vector`, `flag algeria`).
 */
export function stemHasExtraWords(fileStem: string): boolean {
  const raw = fileStem.trim();
  if (!raw) return true;
  return /[\s_\-./]+/.test(raw);
}

export function buildCountryStemAliases(
  countrySlug: string,
  isoAlpha2?: string | null,
  countryName?: string | null,
): Set<string> {
  const aliases = new Set<string>();
  const add = (value: string) => {
    const c = compactAlphanumeric(value);
    if (c.length >= 2) aliases.add(c);
  };

  const slug = countrySlug.trim().toLowerCase();
  if (slug) {
    add(slug);
    for (const part of slug.split(/[-_]+/)) add(part);
  }

  const iso = isoAlpha2?.trim().toLowerCase();
  if (iso) {
    add(iso);
    for (const alt of ISO_COLLOQUIAL[iso] ?? []) add(alt);
  }

  const name = countryName?.trim();
  if (name) {
    add(name);
    for (const word of name.split(/\s+/)) {
      if (word.length >= 3) add(word);
    }
  }

  return aliases;
}

/**
 * Free official flag: stem is exactly the country name (no spaces, underscores, or extra labels).
 * Examples: `USA.png` ✓ · `USA_flag.png` ✗ · `USA_vector_file.eps` ✗
 */
export function isCountryOnlyOfficialStem(
  fileStem: string,
  countrySlug: string,
  isoAlpha2?: string | null,
  countryName?: string | null,
): boolean {
  if (stemHasExtraWords(fileStem)) return false;

  const stem = compactAlphanumeric(fileStem);
  if (!stem) return false;

  const aliases = buildCountryStemAliases(countrySlug, isoAlpha2, countryName);
  return aliases.has(stem);
}

function matchCreative(pathAndStem: string): FlagDesignType | null {
  const s = pathAndStem;
  if (/\bvideo\b|\/videos?\//i.test(s)) return 'video';
  if (/\bwave\b|flag-wave|-wave|\/wave\//i.test(s)) return 'wave';
  if (/\bcircle\b|flag-circle|-circle|\/circle\//i.test(s)) return 'circle';
  if (/\bheart\b|flag-heart|-heart|\/heart\//i.test(s)) return 'heart';
  if (/\bsphere\b|flag-sphere|-sphere|\/sphere\//i.test(s)) return 'sphere';
  if (/\bmap\b|flag-map|-map|\/map\//i.test(s)) return 'map';
  if (/\bmockup\b|\/mockup\//i.test(s)) return 'mockup';
  if (/\bbanner\b|\/banner\//i.test(s)) return 'banner';
  if (/icon.?pack|\bicons\b|\/icons?\//i.test(s)) return 'icon_pack';
  return null;
}

function hasGenericCreativeNoise(s: string): boolean {
  return CREATIVE_SUBSTRINGS.some((k) => s.includes(k));
}

export function classifyFlagDesign(params: {
  r2Key: string;
  fileStem: string;
  countrySlug?: string;
  isoAlpha2?: string | null;
  countryName?: string | null;
  format?: string;
}): {
  design_type: FlagDesignType;
  premium_tier: 'free' | 'paid';
  is_country_cover_candidate: boolean;
  is_preview_only: boolean;
} {
  const key = norm(params.r2Key);
  const stem = norm(params.fileStem);
  const combined = `${key} ${stem}`;
  const countrySlug = (params.countrySlug ?? '').trim().toLowerCase();
  const previewOnly = isPreviewOnlyFormat(params.format);
  const videoFormat = isFlagVideoFormat(params.format);
  const fmt = (params.format ?? '').trim().toLowerCase();

  if (fmt === 'psd') {
    return {
      design_type: 'mockup',
      premium_tier: 'paid',
      is_country_cover_candidate: false,
      is_preview_only: false,
    };
  }

  if (videoFormat) {
    return {
      design_type: 'video',
      premium_tier: 'paid',
      is_country_cover_candidate: false,
      is_preview_only: false,
    };
  }

  const explicitCreative = matchCreative(combined);
  if (explicitCreative) {
    return {
      design_type: explicitCreative,
      premium_tier: 'paid',
      is_country_cover_candidate: previewOnly,
      is_preview_only: previewOnly,
    };
  }

  if (hasGenericCreativeNoise(combined)) {
    return {
      design_type: 'other',
      premium_tier: 'paid',
      is_country_cover_candidate: previewOnly,
      is_preview_only: previewOnly,
    };
  }

  const countryOnly =
    countrySlug.length > 0 &&
    isCountryOnlyOfficialStem(params.fileStem, countrySlug, params.isoAlpha2, params.countryName);

  if (countryOnly) {
    return {
      design_type: 'official_flat',
      premium_tier: previewOnly ? 'paid' : 'free',
      is_country_cover_candidate: true,
      is_preview_only: previewOnly,
    };
  }

  return {
    design_type: 'other',
    premium_tier: 'paid',
    is_country_cover_candidate: previewOnly,
    is_preview_only: previewOnly,
  };
}

/** Cover-format priority rank for official_flat rows (lower = better). */
export function coverFormatRank(format: string): number {
  const f = format.toLowerCase();
  if (f === 'webp') return 0;
  if (f === 'jpg' || f === 'jpeg') return 1;
  if (f === 'png') return 2;
  if (f === 'svg') return 3;
  return 9;
}
