/**
 * Allow only same-origin relative paths for open-redirect-safe return URLs.
 * Rejects protocol-relative URLs, absolute URLs, and backslash tricks.
 */
export function getSafeInternalReturnPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === '' || !s.startsWith('/') || s.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) return null;
  if (s.includes('\\')) return null;
  return s;
}
