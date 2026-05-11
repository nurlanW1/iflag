import { getCountryName } from '@/lib/country-code-to-name';
import { getCountryCode } from '@/lib/country-mapping';

function prettifyTechnicalLabel(raw: string): string {
  if (!raw.trim()) return raw || '';
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function deriveCoreCountryToken(storedName: string, slug: string): string {
  const primary = (storedName || slug || '').trim();
  if (!primary) return '';
  let s = primary.replace(/_/g, ' ').trim();
  s = s.replace(/\bnational\s+flag\s+of\s+/gi, '').trim();
  s = s.replace(/^flag\s+of\s+/i, '').trim();
  s = s.replace(/\s+flag\s*$/i, '').trim();
  return s;
}

/** ISO name first, then name/slug-derived mapping, else prettified slug / filename. */
export function resolveGalleryDisplayName(
  storedName: string,
  isoAlpha2: string | null,
  slug: string,
): string {
  const isoTrim = isoAlpha2?.trim();
  const iso = isoTrim ? isoTrim.toUpperCase() : '';
  if (iso) {
    const canonical = getCountryName(iso);
    if (canonical) return canonical;
  }

  const core = deriveCoreCountryToken(storedName, slug);
  const titleWords = core
    ? core
        .split(/\s+/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
    : '';

  if (titleWords) {
    let mapped =
      getCountryCode(titleWords) ||
      getCountryCode(core.charAt(0).toUpperCase() + core.slice(1).toLowerCase());

    const fromSlugHyphen = slug
      .split('-')
      .filter(Boolean)
      .map((segment) =>
        segment
          .replace(/_/g, ' ')
          .split(/\s+/)
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
          .join(' '),
      )
      .join(' ');
    if (!mapped && fromSlugHyphen) {
      mapped = getCountryCode(fromSlugHyphen);
    }

    if (mapped) {
      const canon = getCountryName(mapped);
      if (canon) return canon;
    }
    return titleWords;
  }

  return prettifyTechnicalLabel((slug || storedName || '').replace(/-|_/g, ' '));
}
