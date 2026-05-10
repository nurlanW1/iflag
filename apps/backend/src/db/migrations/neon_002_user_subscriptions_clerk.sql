-- Clerk-backed subscription rows for Flagswing download gates (Neon / Postgres).
-- Apply after neon_001. Safe to re-run: creates table only if missing.

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  email TEXT,
  plan TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_clerk_user_id ON user_subscriptions (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_period ON user_subscriptions (clerk_user_id, status, current_period_end);

COMMENT ON TABLE user_subscriptions IS 'Flagswing: maps Clerk users to paid plan periods. Populate via billing webhooks or admin.';
