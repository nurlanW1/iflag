/**
 * Single allowed admin identity for /admin routes (Clerk primary email).
 * Server: prefer `ADMIN_EMAIL`. Client (Navbar): `NEXT_PUBLIC_ADMIN_EMAIL`, often mirrored from ADMIN_EMAIL via next.config.mjs env.
 */

export function normalizeAdminEmail(email: string | undefined | null): string {
  return email?.trim().toLowerCase() ?? '';
}

/** ADMIN_EMAIL checks in middleware / server routes. Falls back to NEXT_PUBLIC_ADMIN_EMAIL if set server-side (e.g. Vercel). */
export function getConfiguredAdminEmail(): string {
  return normalizeAdminEmail(
    process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ''
  );
}

/** Navbar (client bundle): use NEXT_PUBLIC_* injected at build via next.config. */
export function getClientExpectedAdminEmail(): string {
  return normalizeAdminEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '');
}

export function clerkEmailMatchesAdmin(userEmail: string | undefined | null): boolean {
  const expected = getClientExpectedAdminEmail();
  // --- Admin UI visibility: NEXT_PUBLIC_ADMIN_EMAIL must be set (or mirrored from ADMIN_EMAIL in next.config) ---
  if (!expected) return false;
  return normalizeAdminEmail(userEmail) === expected;
}

export function serverEmailMatchesConfiguredAdmin(userEmail: string | undefined | null): boolean {
  const expected = getConfiguredAdminEmail();
  if (!expected) return false;
  return normalizeAdminEmail(userEmail) === expected;
}
