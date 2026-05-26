/**
 * Classify uploaded / imported flag files into design types & pricing tier.
 * Used by `import:r2`, `backfill:country-folders`.
 *
 * Product rules:
 * - Filename stem is **only** the country name (e.g. `uzbekistan`, `algeria`) → free official flag
 * - Any extra tokens (e.g. `flag uzbekistan`, `uzbekistan wave`) → paid creative catalog
 * - WebP masters are preview/cover assets only (not downloadable catalog formats)
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

function tokensFromStem(stem: string): string[] {
  const s = norm(stem).replace(/[^\p{L}\p{N}\s\-]+/gu, ' ');
  const parts = s.split(/[\s/_\-.]+/).map((w) => w.trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

function countrySlugTokens(countrySlug: string): string[] {
  return countrySlug
    .trim()
    .toLowerCase()
    .split(/[-_]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function tokenMatchesCountry(token: string, countryToken: string): boolean {
  const t = token.replace(/-/g, '');
  const c = countryToken.replace(/-/g, '');
  return t === c || t.includes(c) || c.includes(t);
}

/**
 * True when the filename stem is only the country name (any separators), e.g. `algeria`, `uzbekistan`.
 * Stems like `flag uzbekistan` or `uzbekistan wave` return false.
 */
export function isCountryOnlyOfficialStem(fileStem: string, countrySlug: string): boolean {
  const stemTokens = tokensFromStem(fileStem);
  const countryTokens = countrySlugTokens(countrySlug);
  if (!stemTokens.length || !countryTokens.length) return false;

  const remaining = [...stemTokens];
  for (const ct of countryTokens) {
    const idx = remaining.findIndex((t) => tokenMatchesCountry(t, ct));
    if (idx < 0) return false;
    remaining.splice(idx, 1);
  }

  return remaining.length === 0;
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
  /** Resolved country slug for stem-only free detection */
  countrySlug?: string;
  /** File extension / normalized format */
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

  const inOfficialFolder = /(^|\/)official(\/|$)/.test(key);

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

  const countryOnlyStem =
    countrySlug.length > 0 && isCountryOnlyOfficialStem(params.fileStem, countrySlug);

  const officialSignals =
    inOfficialFolder ||
    OFFICIAL_SUBSTRINGS.some((k) => combined.includes(k)) ||
    countryOnlyStem;

  if (officialSignals) {
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

/** Cover-format priority rank for official_flat rows (lower = better). EPS/AI/PDF excluded upstream. */
export function coverFormatRank(format: string): number {
  const f = format.toLowerCase();
  if (f === 'webp') return 0;
  if (f === 'jpg' || f === 'jpeg') return 1;
  if (f === 'png') return 2;
  if (f === 'svg') return 3;
  return 9;
}
