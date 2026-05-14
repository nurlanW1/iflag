-- =============================================================================
-- Email verification + password reset tokens.
-- Safe / idempotent.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- email_verification_tokens
--   - One row per outstanding verify request.
--   - We store sha256(token) in `token_hash` and only return the raw token to
--     the user in the email link. DB leak ≠ account takeover.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user_id
  ON email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires
  ON email_verification_tokens (expires_at)
  WHERE consumed_at IS NULL;

-- -----------------------------------------------------------------------------
-- password_reset_tokens — same shape, separate table for clarity & isolation.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id
  ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires
  ON password_reset_tokens (expires_at)
  WHERE consumed_at IS NULL;

-- -----------------------------------------------------------------------------
-- email_outbox — log of every transactional email we attempted to send.
--   Useful for compliance, retry, and debugging.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  subject VARCHAR(998) NOT NULL,
  template VARCHAR(64) NOT NULL,
  body_text TEXT,
  body_html TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider VARCHAR(32),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox (status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_to_email ON email_outbox (to_email);
CREATE INDEX IF NOT EXISTS idx_email_outbox_created_at ON email_outbox (created_at DESC);
