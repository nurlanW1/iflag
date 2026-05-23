'use client';

import type { ClerkEmailUserLike } from '@/lib/auth/admin-email';
import { normalizedEmailsFromClerkUser } from '@/lib/auth/admin-email';

/** Build-time mirror of MARKETPLACE_OWNER_DOWNLOAD_EMAILS (see next.config.mjs). */
function ownerDownloadEmailsFromEnv(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_MARKETPLACE_OWNER_DOWNLOAD_EMAILS?.trim() ?? '';
  const parts = raw
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!parts.length) {
    return new Set(['nurlanrahmonqulov@gmail.com']);
  }
  return new Set(parts);
}

/** True when the Clerk user’s primary/link emails match storefront owner-download bypass — not admin-panel access. */
export function clientUserMatchesOwnerDownloadBypass(user: ClerkEmailUserLike | null | undefined): boolean {
  if (!user) return false;
  const allowed = ownerDownloadEmailsFromEnv();
  return normalizedEmailsFromClerkUser(user).some((e) => allowed.has(e));
}
