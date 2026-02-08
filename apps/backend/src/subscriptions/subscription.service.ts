import pool from '../db.js';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  duration_days: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
}

// Get all active subscription plans
export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  const result = await pool.query(
    'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY duration_days'
  );
  return result.rows;
}

// Get plan by slug
export async function getPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
  const result = await pool.query(
    'SELECT * FROM subscription_plans WHERE slug = $1 AND is_active = TRUE',
    [slug]
  );
  return result.rows[0] || null;
}

// Get user's active subscription
export async function getUserActiveSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const result = await pool.query(
    `SELECT * FROM user_subscriptions
     WHERE user_id = $1 AND status = 'active' AND current_period_end > CURRENT_TIMESTAMP
     ORDER BY current_period_end DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

// Check if user has active premium subscription
export async function hasActivePremiumSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserActiveSubscription(userId);
  return subscription !== null;
}

// Create subscription
export async function createSubscription(
  userId: string,
  planId: string,
  stripeSubscriptionId: string | null = null
): Promise<UserSubscription> {
  const plan = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
  if (plan.rows.length === 0) {
    throw new Error('Subscription plan not found');
  }

  const planData = plan.rows[0];
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + planData.duration_days);

  const result = await pool.query(
    `INSERT INTO user_subscriptions 
     (user_id, plan_id, stripe_subscription_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, $3, 'active', $4, $5)
     RETURNING *`,
    [userId, planId, stripeSubscriptionId, now, periodEnd]
  );

  return result.rows[0];
}

// Update subscription status
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: UserSubscription['status']
): Promise<void> {
  await pool.query('UPDATE user_subscriptions SET status = $1 WHERE id = $2', [
    status,
    subscriptionId,
  ]);
}

// Update subscription from Stripe webhook
export async function updateSubscriptionFromStripe(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean = false
): Promise<void> {
  const mappedStatus: UserSubscription['status'] =
    status === 'active'
      ? 'active'
      : status === 'canceled'
      ? 'canceled'
      : status === 'past_due'
      ? 'past_due'
      : status === 'trialing'
      ? 'trialing'
      : 'expired';

  await pool.query(
    `UPDATE user_subscriptions
     SET status = $1, current_period_start = $2, current_period_end = $3, cancel_at_period_end = $4, updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = $5`,
    [mappedStatus, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, stripeSubscriptionId]
  );
}

// Cancel subscription
export async function cancelSubscription(
  userId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  await pool.query(
    `UPDATE user_subscriptions
     SET cancel_at_period_end = $1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2 AND status = 'active'`,
    [cancelAtPeriodEnd, userId]
  );
}

// Expire old subscriptions
export async function expireOldSubscriptions(): Promise<number> {
  const result = await pool.query(
    `UPDATE user_subscriptions
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active' AND current_period_end < CURRENT_TIMESTAMP
     RETURNING id`
  );
  return result.rows.length;
}
