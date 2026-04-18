/**
 * Prevent open redirects: only allow relative same-site paths.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined, fallback: string): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('://')) return fallback;
  return trimmed;
}
