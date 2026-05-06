/**
 * Admin allow-list: Clerk user's primary email must match `ADMIN_EMAIL` (mirrored client-side via
 * `NEXT_PUBLIC_ADMIN_EMAIL` in next.config.mjs). No secrets belong on the browser.
 */

export function normalizeAdminEmail(email: string | undefined | null): string {
  return email?.trim().toLowerCase() ?? '';
}

/** Middleware + API routes: server env */
export function getConfiguredAdminEmail(): string {
  return normalizeAdminEmail(process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '');
}

/** Navbar / Dashboard / client bundles: inlined at build via next.config.mjs */
export function getClientExpectedAdminEmail(): string {
  return normalizeAdminEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '');
}

export function clerkEmailMatchesAdmin(userEmail: string | undefined | null): boolean {
  const expected = getClientExpectedAdminEmail();
  if (!expected) return false;
  return normalizeAdminEmail(userEmail) === expected;
}

export function serverEmailMatchesConfiguredAdmin(userEmail: string | undefined | null): boolean {
  const expected = getConfiguredAdminEmail();
  if (!expected) return false;
  return normalizeAdminEmail(userEmail) === expected;
}
