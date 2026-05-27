-- Clerk user id on user_subscriptions for Flagswing download gates (Neon / Postgres).
-- Safe when baseline schema already created user_subscriptions with user_id/plan_id:
-- only adds clerk_user_id + indexes instead of replacing the table.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_subscriptions'
  ) THEN
    CREATE TABLE user_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id TEXT,
      email TEXT,
      plan TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_clerk_user_id
  ON user_subscriptions (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_period
  ON user_subscriptions (clerk_user_id, status, current_period_end)
  WHERE clerk_user_id IS NOT NULL;

COMMENT ON COLUMN user_subscriptions.clerk_user_id IS
  'Optional Clerk user id for Flagswing download gates; Paddle rows may use user_id only.';
