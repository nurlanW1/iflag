/**
 * Derive stable marketplace grouping slugs & display titles for flag file rows.
 * Kept deterministic for import scripts + Neon backfills.
 */

import { slugifySegment } from '../storage/r2.js';

const GROUP_STOP = new Set([
  'flag',
  'flags',
  'vector',
  'sphere',
  'circle',
  'heart',
  'of',
  'the',
  'and',
  'or',
  'for',
  'a',
  'an',
  'icon',
  'icons',
  'graphic',
  'graphics',
]);

function slugToken(raw: string): string {
  return slugifySegment(raw.replace(/[^\p{L}\p{N}\s\-_/]+/gu, ' '), 96) || 'x';
}

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/^[\s_-]+|[\s_-]+$/g, '').trim();
}

/** Split filenames / folder names into word tokens */
function tokensFromPiece(piece: string): string[] {
  const t = slugifySegment(piece.replace(/[^\p{L}\p{N}\s\-_/]+/gu, ' '), 96);
  return t.split(/[\s/_-]+/).map(normalizeWord).filter(Boolean);
}

function uniqueOrdered(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (!w || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function deriveDisplayTitle(params: { countryName: string; fileStemNoExt: string }): string {
  const headline = params.countryName?.trim() || humanizeSlug('flag');
  const bits = tokensFromPiece(params.fileStemNoExt).filter((w) => !GROUP_STOP.has(w));
  const extra = bits
    .join(' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .trim();
  return extra.length > 0 ? `${headline} — ${extra}` : `${headline} Flag`;
}

/** Deterministic asset_group_key for multi-format grouping */
export function deriveAssetGroupKeyFromParts(parts: {
  countrySlug: string;
  folderSegments: string[];
  fileStemNoExt: string;
}): string {
  const c = slugToken(parts.countrySlug);
  const cmp = (w: string) => slugToken(w).replace(/-/g, '') === c.replace(/-/g, '');

  const pieces: string[] = [];
  for (const seg of parts.folderSegments) {
    const s = seg.trim();
    if (!s.toLowerCase() || s.toLowerCase() === 'flags') continue;
    pieces.push(s);
  }
  pieces.push(parts.fileStemNoExt);

  const wordsFlat: string[] = [];
  for (const p of pieces) {
    wordsFlat.push(...tokensFromPiece(p));
  }

  let design = wordsFlat.map(normalizeWord).filter(Boolean).filter((w) => !GROUP_STOP.has(w));
  design = design.filter((w) => !cmp(w));

  /** Collapse repeats while keeping order */
  design = uniqueOrdered(design);

  if (design.includes('national')) {
    const rest = design.filter((x) => x !== 'national');
    const midSlug = slugifySegment([...rest, 'national'].join(' '), 120);
    return `${c}-${midSlug}-flag`.replace(/-+/g, '-');
  }

  if (design.length === 0) {
    /** Keep distinct R2 filenames visible — avoid collapsing every file into `${c}-flag`. */
    const stemSlug = slugifySegment(parts.fileStemNoExt.replace(/[^\p{L}\p{N}\s\-_/]+/gu, ' '), 96);
    if (stemSlug && stemSlug !== c && !cmp(stemSlug)) {
      return `${c}-${stemSlug}`.replace(/-+/g, '-');
    }
    return `${c}-flag`;
  }

  const bodySlug = slugifySegment(design.join(' '), 120);
  return `${c}-flag-${bodySlug}`.replace(/-+/g, '-');
}
