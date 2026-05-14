-- =============================================================================
-- Billing: Lemon Squeezy integration (provider-neutral schema)
-- Safe to run on existing DB. Idempotent: ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS.
--
-- Why: backend was originally scaffolded for Stripe (stripe_subscription_id,
-- stripe_price_id), but frontend ships with Lemon Squeezy. This migration:
--   1. Adds provider-neutral columns alongside Stripe ones (no data loss).
--   2. Adds tables for one-time orders and webhook idempotency.
--   3. Backfills `billing_provider = 'lemonsqueezy'` where unset.
--
-- Run order: after schema.sql (v1), neon_001, neon_002.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) subscription_plans: provider-neutral variant id + provider tag
-- -----------------------------------------------------------------------------
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS billing_provider VARCHAR(32) NOT NULL DEFAULT 'lemonsqueezy';

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS provider_variant_id VARCHAR(255);

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_provider_variant
  ON subscription_plans (billing_provider, provider_variant_id);

-- -----------------------------------------------------------------------------
-- 2) user_subscriptions: provider columns + lifecycle timestamps
-- -----------------------------------------------------------------------------
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS billing_provider VARCHAR(32) NOT NULL DEFAULT 'lemonsqueezy';

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS provider_subscription_id VARCHAR(255);

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS provider_customer_id VARCHAR(255);

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS provider_variant_id VARCHAR(255);

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(255);

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS update_payment_method_url TEXT;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS customer_portal_url TEXT;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS pause_starts_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS pause_resumes_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS provider_status VARCHAR(64);

-- Expand status check constraint to include LS states (paused, on_trial, unpaid).
-- We DROP-IF-EXISTS the implicit constraint and re-create it. The constraint name from
-- schema.sql is auto-generated; query catalog to find it generically.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'user_subscriptions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE user_subscriptions DROP CONSTRAINT %I', cname);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table might not exist or constraint already dropped; safe to ignore.
  NULL;
END $$;

ALTER TABLE user_subscriptions
  ADD CONSTRAINT user_subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing', 'paused', 'unpaid'));

-- Indexes (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_provider_sub_id
  ON user_subscriptions (billing_provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_provider_customer
  ON user_subscriptions (billing_provider, provider_customer_id)
  WHERE provider_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_lookup
  ON user_subscriptions (user_id, status, current_period_end);

-- -----------------------------------------------------------------------------
-- 3) orders: one-time purchases (single asset / pack)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_provider VARCHAR(32) NOT NULL DEFAULT 'lemonsqueezy',
  provider_order_id VARCHAR(255) NOT NULL,
  provider_customer_id VARCHAR(255),
  provider_variant_id VARCHAR(255),
  product_slug VARCHAR(255),
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(32) NOT NULL DEFAULT 'paid'
    CHECK (status IN ('pending', 'paid', 'refunded', 'partial_refund', 'failed', 'voided')),
  refunded_at TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (billing_provider, provider_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_product_slug ON orders (product_slug);
CREATE INDEX IF NOT EXISTS idx_orders_asset_id ON orders (asset_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4) webhook_deliveries: per-provider idempotency log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(32) NOT NULL,
  idempotency_key VARCHAR(512) NOT NULL,
  event_name VARCHAR(128),
  resource_type VARCHAR(64),
  resource_id VARCHAR(255),
  signature VARCHAR(255),
  payload_hash VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed', 'duplicate')),
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (provider, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_provider_event
  ON webhook_deliveries (provider, event_name);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status
  ON webhook_deliveries (status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_received_at
  ON webhook_deliveries (received_at DESC);

-- -----------------------------------------------------------------------------
-- 5) Backfill defaults on existing rows
-- -----------------------------------------------------------------------------
UPDATE subscription_plans
  SET billing_provider = 'lemonsqueezy'
  WHERE billing_provider IS NULL;

UPDATE user_subscriptions
  SET billing_provider = 'lemonsqueezy'
  WHERE billing_provider IS NULL;

-- If old Stripe ids were used, copy them across (no data loss).
UPDATE subscription_plans
  SET provider_variant_id = stripe_price_id
  WHERE provider_variant_id IS NULL AND stripe_price_id IS NOT NULL;

UPDATE user_subscriptions
  SET provider_subscription_id = stripe_subscription_id
  WHERE provider_subscription_id IS NULL AND stripe_subscription_id IS NOT NULL;
