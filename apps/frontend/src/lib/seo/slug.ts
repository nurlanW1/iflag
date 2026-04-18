/**
 * Public slug rules for SEO routes — lowercase, hyphenated, no path traversal.
 */
export function isValidPublicSlug(segment: string): boolean {
  return (
    segment.length > 0 &&
    segment.length <= 200 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(segment) &&
    !segment.includes('..')
  );
}

/** ISO 3166-1 alpha-2 for country hub URLs */
export function normalizeCountryCode(code: string): string | null {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return null;
  return c;
}
