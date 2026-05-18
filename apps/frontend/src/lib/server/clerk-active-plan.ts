import type { Pool } from 'pg';

/**
 * Active plan: status active AND current_period_end in the future.
 * Uses `user_subscriptions` (Clerk) from neon_002 migration.
 */
export async function hasActiveClerkSubscription(pool: Pool, clerkUserId: string): Promise<boolean> {
  try {
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
  } catch (e: unknown) {
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code?: string }).code) : '';
    // Postgres: undefined_table — Neon DB missing Clerk subscription table.
    if (code === '42P01') {
      console.warn(
        '[clerk-active-plan] Table user_subscriptions is missing on DATABASE_URL. ' +
          'Open Neon SQL Editor and run: apps/backend/src/db/migrations/neon_002_user_subscriptions_clerk.sql ' +
          '(after neon_001 if you use gallery-from-db). Paid plan checks will return false until then.'
      );
      return false;
    }
    throw e;
  }
}
