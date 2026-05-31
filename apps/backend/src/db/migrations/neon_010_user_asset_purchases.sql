-- Lifetime one-time asset ownership (Paddle $1 purchases per design group).

CREATE TABLE IF NOT EXISTS user_asset_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_group_key TEXT NOT NULL,
  product_slug VARCHAR(255),
  asset_id UUID,
  paddle_transaction_id VARCHAR(255) NOT NULL,
  purchase_type VARCHAR(32) NOT NULL DEFAULT 'one_time'
    CHECK (purchase_type IN ('one_time')),
  status VARCHAR(32) NOT NULL DEFAULT 'paid'
    CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_asset_purchases_user_asset UNIQUE (user_id, asset_group_key),
  CONSTRAINT uq_user_asset_purchases_paddle_tx UNIQUE (paddle_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_user_asset_purchases_user_id
  ON user_asset_purchases (user_id);

CREATE INDEX IF NOT EXISTS idx_user_asset_purchases_status
  ON user_asset_purchases (user_id, status)
  WHERE status = 'paid';

CREATE INDEX IF NOT EXISTS idx_user_asset_purchases_product_slug
  ON user_asset_purchases (user_id, product_slug)
  WHERE product_slug IS NOT NULL;

DROP TRIGGER IF EXISTS update_user_asset_purchases_updated_at ON user_asset_purchases;
CREATE TRIGGER update_user_asset_purchases_updated_at
  BEFORE UPDATE ON user_asset_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_asset_purchases IS
  'Permanent per-design access after Paddle one-time checkout (keyed by asset_group_key).';
