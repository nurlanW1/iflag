import type { Pool } from 'pg';

/**
 * Active plan: status active AND current_period_end in the future.
 * Checks clerk_user_id when set; otherwise matches users.email to Clerk primary email.
 */
export async function hasActiveClerkSubscription(
  pool: Pool,
  clerkUserId: string,
  clerkEmails: string[] = [],
): Promise<boolean> {
  try {
    const byClerkId = await pool.query<{ ok: number }>(
      `SELECT 1 AS ok
       FROM user_subscriptions
       WHERE clerk_user_id = $1
         AND lower(status) IN ('active', 'trialing', 'past_due')
         AND current_period_end > NOW()
       LIMIT 1`,
      [clerkUserId],
    );
    if (byClerkId.rows.length > 0) return true;

    const emails = clerkEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length === 0) return false;

    const byEmail = await pool.query<{ ok: number }>(
      `SELECT 1 AS ok
       FROM user_subscriptions us
       INNER JOIN users u ON u.id = us.user_id
       WHERE lower(trim(u.email)) = ANY($1::text[])
         AND lower(us.status) IN ('active', 'trialing', 'past_due')
         AND us.current_period_end > NOW()
       LIMIT 1`,
      [emails],
    );
    return byEmail.rows.length > 0;
  } catch (e: unknown) {
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code?: string }).code) : '';
    if (code === '42P01' || code === '42703') {
      console.warn(
        '[clerk-active-plan] user_subscriptions schema not ready (run backend migrations / neon_002).',
      );
      return false;
    }
    throw e;
  }
}
