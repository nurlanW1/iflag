/**
 * Derive a short display label (e.g. country or region name) from a catalog product title.
 */
export function deriveFlagLabel(title: string): string {
  const t = title.trim();
  if (!t) return 'this';
  const lower = t.toLowerCase();
  const cutSuffixes = [
    ' flag',
    ' — vector',
    ' - vector',
    ' (vector)',
    ' svg',
    ' – vector',
  ];
  for (const s of cutSuffixes) {
    if (lower.endsWith(s)) {
      return t.slice(0, t.length - s.length).trim() || t;
    }
  }
  return t;
}
