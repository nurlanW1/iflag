/**
 * Classify uploaded / imported flag files into design types & pricing tier.
 * Used by `import:r2`, `backfill:country-folders`.
 */

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
  | 'other';

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

const OFFICIAL_SUBSTRINGS = [
  'official',
  'national_flag',
  'national-flag',
  'nationalflag',
  '/flat/',
  '-flat-',
  '_flat_',
  'standard',
];

function norm(s: string): string {
  return s.toLowerCase().replace(/_/g, ' ');
}

function matchCreative(pathAndStem: string): FlagDesignType | null {
  const s = pathAndStem;
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

/**
 * Prefer folder segment `official` as strong signal for official-flat layouts.
 */
export function classifyFlagDesign(params: {
  /** Full object key incl. slashes */
  r2Key: string;
  /** Filename stem without extension */
  fileStem: string;
}): {
  design_type: FlagDesignType;
  premium_tier: 'free' | 'paid';
  is_country_cover_candidate: boolean;
} {
  const key = norm(params.r2Key);
  const stem = norm(params.fileStem);
  const combined = `${key} ${stem}`;

  const inOfficialFolder = /(^|\/)official(\/|$)/.test(key);

  const explicitCreative = matchCreative(combined);
  if (explicitCreative) {
    return {
      design_type: explicitCreative,
      premium_tier: 'paid',
      is_country_cover_candidate: false,
    };
  }

  if (hasGenericCreativeNoise(combined)) {
    return {
      design_type: 'other',
      premium_tier: 'paid',
      is_country_cover_candidate: false,
    };
  }

  const officialSignals =
    inOfficialFolder ||
    OFFICIAL_SUBSTRINGS.some((k) => combined.includes(k)) ||
    /\b[a-z]{2,}\s*-?\s*flag\b/u.test(stem);

  if (officialSignals) {
    return {
      design_type: 'official_flat',
      premium_tier: 'free',
      is_country_cover_candidate: true,
    };
  }

  return {
    design_type: 'other',
    premium_tier: 'paid',
    is_country_cover_candidate: false,
  };
}

/** Cover-format priority rank for official_flat rows (lower = better). EPS/AI/PDF excluded upstream. */
export function coverFormatRank(format: string): number {
  const f = format.toLowerCase();
  if (f === 'webp') return 0;
  if (f === 'jpg' || f === 'jpeg') return 1;
  if (f === 'png') return 2;
  if (f === 'svg') return 3;
  return 9;
}
