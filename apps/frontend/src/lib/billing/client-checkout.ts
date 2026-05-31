import type { useAuth } from '@clerk/nextjs';
import type { CheckoutKind } from '@/components/billing/checkout-button-types';
import { ONE_TIME_STOCK } from '@/lib/marketing/pricing-config';

export type CheckoutPayload = {
  kind: CheckoutKind;
  /** Always `flag-stock` for Paddle price — asset identity is separate. */
  productSlug?: string;
  assetGroupKey?: string | null;
  assetId?: string | null;
  fileId?: string | null;
  assetProductSlug?: string | null;
  countrySlug?: string | null;
  planSlug?: string;
};

async function fetchClerkSessionToken(
  getToken: ReturnType<typeof useAuth>['getToken'],
): Promise<string | null> {
  const fresh = await getToken({ skipCache: true });
  if (fresh) return fresh;
  return getToken();
}

export async function postPaddleCheckout(
  getToken: ReturnType<typeof useAuth>['getToken'],
  payload: CheckoutPayload,
): Promise<
  | { ok: true; url: string; alreadyPurchased?: false }
  | { ok: true; alreadyPurchased: true; ownsProduct: true }
  | { ok: false; error: string }
> {
  const token = await fetchClerkSessionToken(getToken);
  if (!token) {
    return {
      ok: false,
      error: 'Could not read your Clerk session. Refresh the page and try again.',
    };
  }

  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      kind: payload.kind,
      productSlug:
        payload.kind === 'one_time' ? ONE_TIME_STOCK.productSlug : undefined,
      assetGroupKey:
        payload.kind === 'one_time' ? payload.assetGroupKey?.trim() || undefined : undefined,
      assetId: payload.kind === 'one_time' ? payload.assetId?.trim() || undefined : undefined,
      fileId: payload.kind === 'one_time' ? payload.fileId?.trim() || undefined : undefined,
      assetProductSlug:
        payload.kind === 'one_time' ? payload.assetProductSlug?.trim() || undefined : undefined,
      countrySlug:
        payload.kind === 'one_time' ? payload.countrySlug?.trim() || undefined : undefined,
      planSlug: payload.kind === 'subscription' ? payload.planSlug : undefined,
    }),
  });

  const data = (await res.json()) as {
    url?: string;
    error?: string;
    code?: string;
    alreadyPurchased?: boolean;
    ownsProduct?: boolean;
  };

  if (res.ok && data.alreadyPurchased) {
    return { ok: true, alreadyPurchased: true, ownsProduct: true };
  }

  if (res.status === 401) {
    return {
      ok: false,
      error:
        data.error ||
        'Checkout authorization failed. Sign in again or confirm billing API env on Railway.',
    };
  }

  if (!res.ok) {
    if (res.status === 403) {
      return {
        ok: false,
        error:
          data.error ||
          (data.code === 'MFA_REQUIRED'
            ? 'This account has MFA enabled. Sign in with email and password to subscribe.'
            : 'Checkout was denied. Sign in again or contact support.'),
      };
    }
    if (res.status === 503 && data.code === 'BRIDGE_SECRET_MISSING') {
      return {
        ok: false,
        error:
          data.error ||
          'Billing bridge is not configured (set INTERNAL_AUTH_BRIDGE_SECRET on Vercel and Railway).',
      };
    }
    if (res.status === 503 && data.code === 'BRIDGE_FAILED') {
      return { ok: false, error: data.error || 'Could not link your account for Paddle checkout.' };
    }
    if (res.status === 503 && data.code === 'API_URL_MISSING') {
      return { ok: false, error: data.error || 'API URL is not configured on the server.' };
    }
    if (res.status === 503 && data.code === 'CLERK_AUTH_UNAVAILABLE') {
      return {
        ok: false,
        error:
          data.error ||
          'Clerk is not configured on the billing API (set CLERK_SECRET_KEY on the backend).',
      };
    }
    if (res.status === 503 && data.code === 'PADDLE_NOT_CONFIGURED') {
      return {
        ok: false,
        error:
          data.error ||
          'Billing is not configured (set PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET on the API server).',
      };
    }
    if (res.status === 502 && data.code === 'API_UNREACHABLE') {
      return { ok: false, error: data.error || 'Cannot reach the billing API. Try again shortly.' };
    }
    if (res.status === 400 && data.code === 'PADDLE_FLAG_STOCK_PRICE_MISSING') {
      return {
        ok: false,
        error:
          data.error ||
          'Checkout is not configured: set PADDLE_PRICE_MAP_JSON oneTimeByProductSlug.flag-stock on the API server.',
      };
    }
    return { ok: false, error: data.error || 'Checkout failed' };
  }

  if (data.url) {
    return { ok: true, url: data.url };
  }

  return { ok: false, error: 'No checkout URL returned' };
}
