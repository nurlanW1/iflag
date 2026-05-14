-- =============================================================================
-- Switch the active billing provider to Paddle.
-- Idempotent; safe to re-run.
--
-- The schema is already provider-neutral (see migration 003), so this is
-- mostly a metadata + default switch + an extra index for fast lookup by
-- Paddle product/price ids (which use the `pri_*` / `pro_*` prefixes).
-- =============================================================================

-- Default provider for newly-inserted rows.
ALTER TABLE subscription_plans
  ALTER COLUMN billing_provider SET DEFAULT 'paddle';

ALTER TABLE user_subscriptions
  ALTER COLUMN billing_provider SET DEFAULT 'paddle';

ALTER TABLE orders
  ALTER COLUMN billing_provider SET DEFAULT 'paddle';

-- Quick lookup of LS rows that haven't been ported yet.
CREATE INDEX IF NOT EXISTS idx_subscription_plans_billing_provider
  ON subscription_plans (billing_provider);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing_provider
  ON user_subscriptions (billing_provider);

-- Optional: stash the Paddle product id alongside the price id (variant).
-- The price id is what's needed for checkout, the product id is convenient
-- for grouping prices that share a product (e.g. monthly + yearly).
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS provider_product_id VARCHAR(255);

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS provider_product_id VARCHAR(255);

COMMENT ON COLUMN subscription_plans.provider_variant_id IS
  'Provider price/variant id. For Paddle: pri_*. For Lemon Squeezy: numeric variant id.';
COMMENT ON COLUMN subscription_plans.provider_product_id IS
  'Provider product id. For Paddle: pro_*. Optional grouping field.';
