-- =============================================================================
-- Multi-factor authentication tables + columns.
-- Idempotent: safe to re-run.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Add MFA columns to users (matches schema-security.sql style).
-- -----------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;            -- AES-256-GCM ciphertext
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;      -- JSON array of sha256 hashes
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_last_used TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users (mfa_enabled);

-- -----------------------------------------------------------------------------
-- mfa_pending_enrollments — TOTP secret is generated server-side but only
-- activated after the user types a valid code. Keep the unconfirmed secret
-- here so we never write a half-configured state on `users`.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_pending_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  backup_code_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_mfa_pending_user ON mfa_pending_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_pending_expires ON mfa_pending_enrollments (expires_at);

-- -----------------------------------------------------------------------------
-- mfa_challenges — short-lived tokens issued at login phase 1 when the user
-- has MFA enabled. The client posts the token + code to /mfa/verify to receive
-- real session tokens. One-time use.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user ON mfa_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires ON mfa_challenges (expires_at)
  WHERE consumed_at IS NULL;
