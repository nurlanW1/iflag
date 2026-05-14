/**
 * Paddle Billing configuration.
 *
 * Required env (set on backend server):
 *   - PADDLE_API_KEY           Dashboard → Developer Tools → API authentication.
 *                              Sandbox keys start with `pdl_sdbx_apikey_`, live with `pdl_apikey_` / `pdl_live_*`.
 *   - PADDLE_WEBHOOK_SECRET    Dashboard → Developer Tools → Notifications → endpoint signing secret.
 *                              Sandbox: `ntfset_*`. Live: `pdl_ntfset_*`.
 *
 * Optional:
 *   - PADDLE_ENVIRONMENT       "sandbox" | "production" (default: inferred from API key).
 *   - PADDLE_PRICE_MAP_JSON    Maps your local slugs to Paddle price ids:
 *                              { "subscriptionByPlanSlug": {"pro-monthly":"pri_..."},
 *                                "oneTimeByProductSlug":   {"single-flag":"pri_..."} }
 *   - PADDLE_CHECKOUT_SUCCESS_URL    Default redirect after a successful checkout.
 *   - PADDLE_DEFAULT_CURRENCY        Currency for one-off prices (ISO 4217). Default: USD.
 *
 *   Get sandbox keys at https://sandbox-vendors.paddle.com — note that the
 *   sandbox is a completely separate environment with separate IDs.
 */

export type PaddleEnvironment = 'sandbox' | 'production';

export interface PaddleConfig {
  apiKey: string;
  webhookSecret: string;
  environment: PaddleEnvironment;
  apiBase: string;
  checkoutSuccessUrl?: string;
  defaultCurrency: string;
}

const PRODUCTION_BASE = 'https://api.paddle.com';
const SANDBOX_BASE = 'https://sandbox-api.paddle.com';

function inferEnvironment(apiKey: string | undefined): PaddleEnvironment {
  const explicit = process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase();
  if (explicit === 'sandbox' || explicit === 'production') return explicit;
  if (!apiKey) return 'sandbox';
  // Paddle sandbox keys typically contain `sdbx`.
  return apiKey.toLowerCase().includes('sdbx') ? 'sandbox' : 'production';
}

export function getPaddleConfig(): PaddleConfig | null {
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!apiKey || !webhookSecret) return null;

  const env = inferEnvironment(apiKey);
  return {
    apiKey,
    webhookSecret,
    environment: env,
    apiBase: env === 'sandbox' ? SANDBOX_BASE : PRODUCTION_BASE,
    checkoutSuccessUrl:
      process.env.PADDLE_CHECKOUT_SUCCESS_URL?.trim() || undefined,
    defaultCurrency:
      process.env.PADDLE_DEFAULT_CURRENCY?.trim().toUpperCase() || 'USD',
  };
}

export function requirePaddleConfig(): PaddleConfig {
  const cfg = getPaddleConfig();
  if (!cfg) {
    const err: any = new Error(
      'Paddle is not configured. Set PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET.'
    );
    err.status = 503;
    err.code = 'PADDLE_NOT_CONFIGURED';
    throw err;
  }
  return cfg;
}
