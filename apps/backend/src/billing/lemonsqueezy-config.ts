/**
 * Lemon Squeezy configuration loader.
 *
 * Required env (set on backend server):
 *   - LEMONSQUEEZY_API_KEY        Settings → API → create key
 *   - LEMONSQUEEZY_STORE_ID       Settings → Stores → numeric id
 *   - LEMONSQUEEZY_SIGNING_SECRET Settings → Webhooks → signing secret for the endpoint
 *
 * Optional:
 *   - LEMONSQUEEZY_CHECKOUT_SUCCESS_URL   Where the customer returns after paying
 *   - LEMONSQUEEZY_TEST_MODE              "true" while the store is in test mode
 *   - LEMONSQUEEZY_VARIANT_MAP_JSON       see lemonsqueezy-mapping.ts
 */

export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  signingSecret: string;
  checkoutSuccessUrl?: string;
  testMode: boolean;
}

export const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

/** Returns config if all required vars are present, else null (route returns 503). */
export function getLemonSqueezyConfig(): LemonSqueezyConfig | null {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim();
  const signingSecret = process.env.LEMONSQUEEZY_SIGNING_SECRET?.trim();

  if (!apiKey || !storeId || !signingSecret) return null;

  return {
    apiKey,
    storeId,
    signingSecret,
    checkoutSuccessUrl:
      process.env.LEMONSQUEEZY_CHECKOUT_SUCCESS_URL?.trim() || undefined,
    testMode: process.env.LEMONSQUEEZY_TEST_MODE === 'true',
  };
}

/** Use when a route requires LS to be configured — throws a typed error otherwise. */
export function requireLemonSqueezyConfig(): LemonSqueezyConfig {
  const cfg = getLemonSqueezyConfig();
  if (!cfg) {
    const err = new Error(
      'Billing is not configured. Set LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, and LEMONSQUEEZY_SIGNING_SECRET.'
    );
    (err as any).status = 503;
    (err as any).code = 'BILLING_NOT_CONFIGURED';
    throw err;
  }
  return cfg;
}
