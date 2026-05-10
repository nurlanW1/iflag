import type { Pool } from 'pg';

/**
 * Active plan: status active AND current_period_end in the future.
 * Uses `user_subscriptions` (Clerk) from neon_002 migration.
 */
export async function hasActiveClerkSubscription(pool: Pool, clerkUserId: string): Promise<boolean> {
  const res = await pool.query<{ ok: number }>(
    `SELECT 1 AS ok
     FROM user_subscriptions
     WHERE clerk_user_id = $1
       AND lower(status) = 'active'
       AND current_period_end > NOW()
     LIMIT 1`,
    [clerkUserId]
  );
  return res.rows.length > 0;
}
