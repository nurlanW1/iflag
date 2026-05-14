/**
 * Paddle Billing REST API client.
 *
 * Uses raw fetch (Node 18+) to avoid heavyweight SDKs. JSON responses follow
 * a standard `{ data, meta, errors? }` envelope.
 *
 * @see https://developer.paddle.com/api-reference/overview
 */

import type { PaddleConfig } from './paddle.config.js';

export interface PaddleErrorObject {
  type?: string;
  code?: string;
  detail?: string;
  documentation_url?: string;
}

export interface PaddleEnvelope<T> {
  data?: T;
  meta?: { request_id?: string };
  error?: PaddleErrorObject;
}

export class PaddleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly providerError?: PaddleErrorObject
  ) {
    super(message);
    this.name = 'PaddleApiError';
  }
}

async function paddleFetch<T>(
  cfg: PaddleConfig,
  path: string,
  init: RequestInit = {}
): Promise<PaddleEnvelope<T>> {
  const url = path.startsWith('http')
    ? path
    : `${cfg.apiBase}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  const json = (text ? JSON.parse(text) : {}) as PaddleEnvelope<T>;

  if (!res.ok) {
    const msg =
      json.error?.detail ||
      json.error?.code ||
      `Paddle ${res.status} ${res.statusText}`;
    throw new PaddleApiError(msg, res.status, json.error);
  }

  return json;
}

// ---------------------------------------------------------------------------
// Transactions (hosted checkout)
// ---------------------------------------------------------------------------

export interface PaddleTransactionItem {
  price_id: string;
  quantity: number;
}

export interface CreateTransactionInput {
  items: PaddleTransactionItem[];
  customerEmail: string;
  customerName?: string;
  /**
   * Stored on transaction (and copied to the resulting subscription).
   * Always include `user_id` so we can attribute events to a local user.
   */
  customData?: Record<string, string | number | boolean | null>;
}

export interface PaddleTransaction {
  id: string;
  status: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  invoice_id?: string | null;
  invoice_number?: string | null;
  checkout?: { url?: string | null } | null;
  details?: { totals?: { total?: string; currency_code?: string } } | null;
}

/**
 * Create a checkout transaction.
 *
 * Paddle's "self-service" checkout flow requires only `items` + collection
 * mode `automatic`. The response includes a `checkout.url` you redirect the
 * customer to, OR you can pass the transaction id to `Paddle.Checkout.open()`
 * on the frontend.
 *
 * We also pass `customer.email` so Paddle can prefill the email field, and
 * `custom_data.user_id` so webhooks resolve back to our `users.id`.
 */
export async function createTransaction(
  cfg: PaddleConfig,
  input: CreateTransactionInput
): Promise<PaddleTransaction> {
  const body: Record<string, unknown> = {
    items: input.items.map((it) => ({
      price_id: it.price_id,
      quantity: it.quantity > 0 ? it.quantity : 1,
    })),
    collection_mode: 'automatic',
    currency_code: cfg.defaultCurrency,
    customer: {
      email: input.customerEmail,
      ...(input.customerName ? { name: input.customerName } : {}),
    },
    custom_data: input.customData || {},
    ...(cfg.checkoutSuccessUrl
      ? { checkout: { url: cfg.checkoutSuccessUrl } }
      : {}),
  };

  const res = await paddleFetch<PaddleTransaction>(cfg, '/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.data) {
    throw new PaddleApiError('Paddle response missing transaction data', 502);
  }
  return res.data;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export interface PaddleSubscriptionAttributes {
  id: string;
  status: string;
  customer_id?: string | null;
  address_id?: string | null;
  business_id?: string | null;
  current_billing_period?: {
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
  next_billed_at?: string | null;
  paused_at?: string | null;
  canceled_at?: string | null;
  scheduled_change?: {
    action?: string;
    effective_at?: string;
    resume_at?: string | null;
  } | null;
  items?: Array<{
    price?: { id?: string; product_id?: string } | null;
    quantity?: number;
    status?: string;
  }> | null;
  custom_data?: Record<string, unknown> | null;
  management_urls?: {
    update_payment_method?: string;
    cancel?: string;
  } | null;
}

export type PaddleSubscription = PaddleSubscriptionAttributes;

export async function getSubscription(
  cfg: PaddleConfig,
  subscriptionId: string
): Promise<PaddleSubscription> {
  const res = await paddleFetch<PaddleSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}`
  );
  if (!res.data) throw new PaddleApiError('Subscription not found', 404);
  return res.data;
}

/**
 * Cancel a subscription. `effective_from`:
 *   - `next_billing_period` (default) — soft cancel; access until period end.
 *   - `immediately` — hard cancel.
 */
export async function cancelSubscription(
  cfg: PaddleConfig,
  subscriptionId: string,
  effectiveFrom: 'next_billing_period' | 'immediately' = 'next_billing_period'
): Promise<PaddleSubscription> {
  const res = await paddleFetch<PaddleSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ effective_from: effectiveFrom }),
    }
  );
  if (!res.data) throw new PaddleApiError('Cancel response missing data', 502);
  return res.data;
}

/** Pause subscription. */
export async function pauseSubscription(
  cfg: PaddleConfig,
  subscriptionId: string,
  resumeAt?: string
): Promise<PaddleSubscription> {
  const body: Record<string, unknown> = {
    effective_from: 'next_billing_period',
  };
  if (resumeAt) body.resume_at = resumeAt;

  const res = await paddleFetch<PaddleSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}/pause`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  if (!res.data) throw new PaddleApiError('Pause response missing data', 502);
  return res.data;
}

/** Resume a paused (or about-to-pause) subscription immediately. */
export async function resumeSubscription(
  cfg: PaddleConfig,
  subscriptionId: string,
  effectiveFrom: 'immediately' | string = 'immediately'
): Promise<PaddleSubscription> {
  const res = await paddleFetch<PaddleSubscription>(
    cfg,
    `/subscriptions/${encodeURIComponent(subscriptionId)}/resume`,
    {
      method: 'POST',
      body: JSON.stringify({ effective_from: effectiveFrom }),
    }
  );
  if (!res.data) throw new PaddleApiError('Resume response missing data', 502);
  return res.data;
}

export function pickManagementUrls(
  sub: PaddleSubscription
): { updatePaymentMethod: string | null; cancel: string | null } {
  return {
    updatePaymentMethod: sub.management_urls?.update_payment_method ?? null,
    cancel: sub.management_urls?.cancel ?? null,
  };
}
