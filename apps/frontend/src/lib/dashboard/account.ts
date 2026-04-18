import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSessionUserFromCookies } from '@/lib/auth/session.server';

/** Clerk-backed account summary for the dashboard shell (server-safe). */
export type DashboardAccount = {
  clerkUserId: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
};

/**
 * Stable id for marketplace / account data. Prefer legacy API user id when both exist so
 * existing entitlements keep working during Clerk migration.
 */
export async function getDashboardDataUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  const legacy = await getSessionUserFromCookies();
  if (legacy) {
    return legacy.id;
  }
  return userId;
}
