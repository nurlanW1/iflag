-- Migration: api_keys table
-- Run against your Neon / PostgreSQL database.

CREATE TABLE IF NOT EXISTS api_keys (
  id             SERIAL PRIMARY KEY,
  clerk_user_id  VARCHAR        NOT NULL,
  key_hash       VARCHAR        UNIQUE NOT NULL,
  key_prefix     VARCHAR(16)    NOT NULL,
  plan           VARCHAR        DEFAULT 'free'
                   CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  requests_today INTEGER        DEFAULT 0,
  requests_total INTEGER        DEFAULT 0,
  last_used_at   TIMESTAMP,
  last_reset_at  TIMESTAMP      DEFAULT NOW(),
  created_at     TIMESTAMP      DEFAULT NOW(),
  updated_at     TIMESTAMP      DEFAULT NOW()
);

-- One key per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_clerk_user_id
  ON api_keys (clerk_user_id);

-- Constraint alias for ON CONFLICT support (PostgreSQL requires UNIQUE constraint, not just index)
ALTER TABLE api_keys
  DROP CONSTRAINT IF EXISTS uq_api_keys_clerk_user_id;
ALTER TABLE api_keys
  ADD CONSTRAINT uq_api_keys_clerk_user_id UNIQUE (clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
  ON api_keys (key_hash);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_api_keys_updated_at ON api_keys;
CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
