-- Align subscription plan prices with public pricing ($4.99 weekly, $9.99 monthly).
INSERT INTO subscription_plans (
  name,
  slug,
  duration_days,
  price_cents,
  currency,
  billing_provider,
  is_active
)
VALUES
  ('Pro Weekly', 'pro-weekly', 7, 499, 'USD', 'paddle', TRUE),
  ('Pro Monthly', 'pro-monthly', 30, 999, 'USD', 'paddle', TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  duration_days = EXCLUDED.duration_days,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  billing_provider = 'paddle',
  is_active = TRUE,
  updated_at = NOW();

UPDATE subscription_plans
SET price_cents = 499, billing_provider = 'paddle', is_active = TRUE
WHERE slug = 'weekly-premium';

UPDATE subscription_plans
SET price_cents = 999, billing_provider = 'paddle', is_active = TRUE
WHERE slug = 'monthly-premium';
