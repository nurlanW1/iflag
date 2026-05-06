/**
 * Admin allow-list: any Clerk-linked email matching the configured list grants access.
 *
 * Configure `ADMIN_EMAIL` as comma- or newline-separated emails; mirrors to the client bundle via
 * `next.config.mjs` (`NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST`). If unset, defaults to owner Gmail below.
 */

/** Built-in fallback so Google OAuth + secondary Gmail addresses still resolve when env is omitted. */
const DEFAULT_OWNER_EMAIL = 'nurlanrahmonqulov@gmail.com';

export function normalizeAdminEmail(email: string | undefined | null): string {
  return email?.trim().toLowerCase() ?? '';
}

function splitAllowlistRaw(raw: string): string[] {
  return [...new Set(raw.split(/[,;\n]+/).map(normalizeAdminEmail).filter(Boolean))];
}

/** Middleware + API: prefers server `ADMIN_EMAIL`, then merged public vars, then default. */
function serverAllowlistNormalized(): string[] {
  const raw =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() ||
    DEFAULT_OWNER_EMAIL;
  return splitAllowlistRaw(raw);
}

export function getServerAdminAllowlist(): Set<string> {
  return new Set(serverAllowlistNormalized());
}

/** First entry — useful for logs and legacy helpers expecting a single string. */
export function getConfiguredAdminEmail(): string {
  return serverAllowlistNormalized()[0] ?? '';
}

/** Client bundles — values inlined at build in `next.config.mjs`. */
export function getClientAdminAllowlist(): Set<string> {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() ||
    DEFAULT_OWNER_EMAIL;
  return new Set(splitAllowlistRaw(raw));
}

/** @deprecated Prefer `getClientAdminAllowlist()` or `clientClerkUserMatchesAdmin()` */
export function getClientExpectedAdminEmail(): string {
  const [first] = [...getClientAdminAllowlist()];
  return first ?? '';
}

/** Minimal Clerk user shape shared by `@clerk/nextjs` User on client and server. */
export type ClerkEmailUserLike = {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }> | null;
};

export function normalizedEmailsFromClerkUser(
  user: ClerkEmailUserLike | null | undefined
): string[] {
  if (!user) return [];
  const raw: string[] = [];
  const primary = user.primaryEmailAddress?.emailAddress;
  if (primary) raw.push(primary);
  for (const row of user.emailAddresses ?? []) {
    const a = row?.emailAddress;
    if (a) raw.push(a);
  }
  return [...new Set(raw.map(normalizeAdminEmail).filter(Boolean))];
}

export function serverClerkUserMatchesAdmin(user: ClerkEmailUserLike | null | undefined): boolean {
  const allow = getServerAdminAllowlist();
  if (!allow.size) return false;
  return normalizedEmailsFromClerkUser(user).some((e) => allow.has(e));
}

export function clientClerkUserMatchesAdmin(user: ClerkEmailUserLike | null | undefined): boolean {
  const allow = getClientAdminAllowlist();
  if (!allow.size) return false;
  return normalizedEmailsFromClerkUser(user).some((e) => allow.has(e));
}

/** Match a single mailbox against client allow-list (e.g. server-rendered dashboard email). */
export function clerkEmailMatchesAdmin(userEmail: string | undefined | null): boolean {
  const e = normalizeAdminEmail(userEmail);
  if (!e) return false;
  return getClientAdminAllowlist().has(e);
}

export function serverEmailMatchesConfiguredAdmin(userEmail: string | undefined | null): boolean {
  const e = normalizeAdminEmail(userEmail);
  if (!e) return false;
  return getServerAdminAllowlist().has(e);
}

export function isAdminAllowlistConfigured(): boolean {
  return getServerAdminAllowlist().size > 0;
}
