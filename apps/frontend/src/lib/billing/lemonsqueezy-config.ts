/**
 * Lemon Squeezy — central configuration (secrets from environment only).
 *
 * Where to put IDs:
 * - Store id: Lemon Squeezy → Settings → Stores → copy numeric id → LEMONSQUEEZY_STORE_ID
 * - API key: Settings → API → create key → LEMONSQUEEZY_API_KEY
 * - Webhook signing secret: Settings → Webhooks → your endpoint → signing secret → LEMONSQUEEZY_SIGNING_SECRET
 * - Variant ids: each Product in LS has Variants; map them in LEMONSQUEEZY_VARIANT_MAP_JSON (see lemonsqueezy-mapping.ts)
 */

export type LemonSqueezyClientConfig = {
  apiKey: string;
  storeId: string;
  signingSecret: string;
  /** Base URL for customer redirect after checkout (optional). */
  checkoutSuccessUrl?: string;
};

export function getLemonSqueezyClientConfig(): LemonSqueezyClientConfig | null {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim();
  const signingSecret = process.env.LEMONSQUEEZY_SIGNING_SECRET?.trim();
  if (!apiKey || !storeId || !signingSecret) {
    return null;
  }
  const checkoutSuccessUrl = process.env.LEMONSQUEEZY_CHECKOUT_SUCCESS_URL?.trim();
  return {
    apiKey,
    storeId,
    signingSecret,
    checkoutSuccessUrl: checkoutSuccessUrl || undefined,
  };
}

export const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';
