import type { Pool } from 'pg';
import type { User } from '@clerk/nextjs/server';
import { fetchBackendHasPremium } from '@/lib/account/billing-access.server';
import { isMarketplaceOwnerDownloadBypass } from '@/lib/account/entitlements.server';
import { normalizedEmailsFromClerkUser } from '@/lib/auth/admin-email';
import { hasActiveClerkSubscription } from '@/lib/server/clerk-active-plan';

/**
 * Gallery / Neon flag file downloads (`/api/download/[fileId]`):
 * owner mailbox bypass (`MARKETPLACE_OWNER_DOWNLOAD_EMAILS`; default single owner inbox),
 * Neon `user_subscriptions` (Clerk/Paddle sync), OR backend `check-premium` with JWT cookie.
 * `ADMIN_EMAIL` does **not** unlock storefront file bytes (admin panel only).
 */
export async function userHasFlagswingPaidDownloadAccess(
  pool: Pool,
  clerkUser: User | null | undefined,
  backendAccessToken: string | null | undefined,
): Promise<boolean> {
  if (!clerkUser?.id) return false;

  const emails = normalizedEmailsFromClerkUser(clerkUser);
  if (emails.some((e) => isMarketplaceOwnerDownloadBypass(e))) return true;

  try {
    if (await hasActiveClerkSubscription(pool, clerkUser.id)) return true;
  } catch {
    /* hasActiveClerkSubscription logs missing table already */
  }

  const tok = backendAccessToken?.trim();
  if (tok) {
    const paddle = await fetchBackendHasPremium(tok);
    if (paddle === true) return true;
  }

  return false;
}
