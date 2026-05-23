import type { Pool } from 'pg';
import type { User } from '@clerk/nextjs/server';
import { fetchBackendHasPremium } from '@/lib/account/billing-access.server';
import { isMarketplaceOwnerDownloadBypass } from '@/lib/account/entitlements.server';
import { normalizedEmailsFromClerkUser, serverClerkUserMatchesAdmin } from '@/lib/auth/admin-email';
import { hasActiveClerkSubscription } from '@/lib/server/clerk-active-plan';

/**
 * Gallery / Neon flag file downloads (`/api/download/[fileId]`):
 * Admin allow-list, optional owner-email bypass (`MARKETPLACE_OWNER_DOWNLOAD_EMAILS`),
 * Neon `user_subscriptions` rows (typically filled by Paddle webhooks), OR
 * backend billing `check-premium` when a backend JWT cookie is present.
 */
export async function userHasFlagswingPaidDownloadAccess(
  pool: Pool,
  clerkUser: User | null | undefined,
  backendAccessToken: string | null | undefined,
): Promise<boolean> {
  if (!clerkUser?.id) return false;
  if (serverClerkUserMatchesAdmin(clerkUser)) return true;

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
