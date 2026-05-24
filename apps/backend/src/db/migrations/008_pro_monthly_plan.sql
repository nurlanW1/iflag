-- Pro Monthly plan slug used by the public pricing page checkout (`pro-monthly`).
-- Map the Paddle price id via PADDLE_PRICE_MAP_JSON or provider_variant_id after deploy.
INSERT INTO subscription_plans (
  name,
  slug,
  duration_days,
  price_cents,
  currency,
  billing_provider,
  is_active
)
VALUES ('Pro Monthly', 'pro-monthly', 30, 999, 'USD', 'paddle', TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  duration_days = EXCLUDED.duration_days,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  billing_provider = 'paddle',
  is_active = TRUE,
  updated_at = NOW();
