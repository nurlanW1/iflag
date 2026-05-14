/**
 * Lemon Squeezy REST API client.
 *
 * Uses raw fetch (Node 18+) to avoid pulling in the SDK and keep version drift
 * with the frontend in sync (which also uses fetch).
 *
 * Authentication: Bearer LEMONSQUEEZY_API_KEY.
 * JSON:API content type: application/vnd.api+json.
 */

import {
  LEMONSQUEEZY_API_BASE,
  type LemonSqueezyConfig,
} from './lemonsqueezy-config.js';

interface JsonApiError {
  detail?: string;
  title?: string;
  status?: string;
}

interface JsonApiResponse<T> {
  data?: T;
  errors?: JsonApiError[];
}

class LemonSqueezyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly providerErrors: JsonApiError[] = []
  ) {
    super(message);
    this.name = 'LemonSqueezyApiError';
  }
}

export { LemonSqueezyApiError };

async function lsFetch<T>(
  cfg: LemonSqueezyConfig,
  path: string,
  init: RequestInit = {}
): Promise<JsonApiResponse<T>> {
  const url = path.startsWith('http')
    ? path
    : `${LEMONSQUEEZY_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  const json = (text ? JSON.parse(text) : {}) as JsonApiResponse<T>;

  if (!res.ok) {
    const msg =
      json.errors?.map((e) => e.detail || e.title).filter(Boolean).join('; ') ||
      `LS API ${res.status} ${res.statusText}`;
    throw new LemonSqueezyApiError(msg, res.status, json.errors || []);
  }

  return json;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

interface CheckoutAttributes {
  url?: string;
  expires_at?: string;
}

interface CreateCheckoutInput {
  variantId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  /** Stored on order/subscription metadata as `custom_data.*`. */
  customData?: Record<string, string | number | boolean>;
}

/**
 * Create a hosted checkout. Backend always sends `custom_data.user_id` so that
 * webhooks can attribute the order/subscription back to our users.id.
 */
export async function createCheckout(
  cfg: LemonSqueezyConfig,
  input: CreateCheckoutInput
): Promise<{ checkoutUrl: string; expiresAt: string | null }> {
  const attributes: Record<string, unknown> = {
    checkout_data: {
      email: input.userEmail,
      name: input.userName || '',
      custom: {
        user_id: input.userId,
        ...(input.customData || {}),
      },
    },
    test_mode: cfg.testMode,
  };

  if (cfg.checkoutSuccessUrl) {
    attributes.product_options = { redirect_url: cfg.checkoutSuccessUrl };
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes,
      relationships: {
        store: { data: { type: 'stores', id: cfg.storeId } },
        variant: { data: { type: 'variants', id: input.variantId } },
      },
    },
  };

  const res = await lsFetch<{ attributes: CheckoutAttributes }>(cfg, '/checkouts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const url = res.data?.attributes?.url;
  if (!url) {
    throw new LemonSqueezyApiError('Checkout response missing URL', 502);
  }
  return {
    checkoutUrl: url,
    expiresAt: res.data?.attributes?.expires_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

interface SubscriptionAttributes {
  status?: string;
  cancelled?: boolean;
  renews_at?: string | null;
  ends_at?: string | null;
  trial_ends_at?: string | null;
  variant_id?: number | string | null;
  customer_id?: number | string | null;
  order_id?: number | string | null;
  update_payment_method?: string | null;
  urls?: { update_payment_method?: string; customer_portal?: string } | null;
  user_email?: string | null;
  user_name?: string | null;
  pause?: { mode?: string; resumes_at?: string | null } | null;
}

export interface LemonSubscription {
  id: string;
  attributes: SubscriptionAttributes;
}

export async function getSubscription(
  cfg: LemonSqueezyConfig,
  subscriptionId: string
): Promise<LemonSubscription> {
  const res = await lsFetch<LemonSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}`
  );
  if (!res.data) {
    throw new LemonSqueezyApiError('Subscription not found', 404);
  }
  return res.data;
}

/**
 * Cancel a subscription. By default LS keeps it active until period end
 * (cancel_at_period_end). To cancel immediately, pass `immediate: true`.
 */
export async function cancelSubscription(
  cfg: LemonSqueezyConfig,
  subscriptionId: string
): Promise<LemonSubscription> {
  const res = await lsFetch<LemonSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'DELETE' }
  );
  if (!res.data) {
    throw new LemonSqueezyApiError('Cancel response missing data', 502);
  }
  return res.data;
}

/** Resume a cancelled-but-not-expired subscription. */
export async function resumeSubscription(
  cfg: LemonSqueezyConfig,
  subscriptionId: string
): Promise<LemonSubscription> {
  const body = {
    data: {
      type: 'subscriptions',
      id: String(subscriptionId),
      attributes: { cancelled: false },
    },
  };
  const res = await lsFetch<LemonSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  if (!res.data) {
    throw new LemonSqueezyApiError('Resume response missing data', 502);
  }
  return res.data;
}

/** Pause subscriptions (LS supports `pause_mode: void | free`). */
export async function pauseSubscription(
  cfg: LemonSqueezyConfig,
  subscriptionId: string,
  pauseMode: 'void' | 'free' = 'void',
  resumesAt?: string
): Promise<LemonSubscription> {
  const body = {
    data: {
      type: 'subscriptions',
      id: String(subscriptionId),
      attributes: {
        pause: {
          mode: pauseMode,
          ...(resumesAt ? { resumes_at: resumesAt } : {}),
        },
      },
    },
  };
  const res = await lsFetch<LemonSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  if (!res.data) {
    throw new LemonSqueezyApiError('Pause response missing data', 502);
  }
  return res.data;
}

/** Change the active variant (i.e. plan upgrade/downgrade). */
export async function changeSubscriptionVariant(
  cfg: LemonSqueezyConfig,
  subscriptionId: string,
  newVariantId: string
): Promise<LemonSubscription> {
  const body = {
    data: {
      type: 'subscriptions',
      id: String(subscriptionId),
      attributes: { variant_id: Number(newVariantId) },
    },
  };
  const res = await lsFetch<LemonSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  if (!res.data) {
    throw new LemonSqueezyApiError('Change variant response missing data', 502);
  }
  return res.data;
}

// ---------------------------------------------------------------------------
// Customer portal
// ---------------------------------------------------------------------------

export function pickCustomerPortalUrl(sub: LemonSubscription): string | null {
  return sub.attributes?.urls?.customer_portal || null;
}

export function pickUpdatePaymentMethodUrl(sub: LemonSubscription): string | null {
  return (
    sub.attributes?.urls?.update_payment_method ||
    sub.attributes?.update_payment_method ||
    null
  );
}
