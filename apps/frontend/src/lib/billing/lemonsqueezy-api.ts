import { LEMONSQUEEZY_API_BASE, type LemonSqueezyClientConfig } from '@/lib/billing/lemonsqueezy-config';

type CheckoutCreateResponse = {
  data?: {
    attributes?: {
      url?: string;
    };
  };
  errors?: { detail?: string }[];
};

/**
 * Create a hosted checkout for a variant. Links account via checkout_data.custom.user_id
 * (surfaced on webhooks as meta.custom_data).
 */
export async function createLemonSqueezyCheckout(
  config: LemonSqueezyClientConfig,
  params: {
    variantId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    /** Test checkouts when LS store is in test mode */
    testMode?: boolean;
  }
): Promise<{ checkoutUrl: string }> {
  const attributes: Record<string, unknown> = {
    checkout_data: {
      email: params.userEmail ?? '',
      name: params.userName ?? '',
      custom: {
        user_id: params.userId,
      },
    },
    test_mode: params.testMode === true,
  };
  if (config.checkoutSuccessUrl) {
    attributes.product_options = { redirect_url: config.checkoutSuccessUrl };
  }
  if (params.testMode) {
    attributes.checkout_options = { embed: false };
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes,
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: config.storeId,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: params.variantId,
          },
        },
      },
    },
  };

  const res = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as CheckoutCreateResponse;
  if (!res.ok) {
    const msg = json.errors?.map((e) => e.detail).join('; ') || res.statusText;
    throw new Error(`LemonSqueezy checkout failed: ${msg}`);
  }
  const url = json.data?.attributes?.url;
  if (!url) {
    throw new Error('LemonSqueezy checkout response missing URL');
  }
  return { checkoutUrl: url };
}

type CheckoutRetrieveResponse = {
  data?: {
    attributes?: {
      status?: string;
    };
  };
};

/** Optional: poll checkout state after redirect (client verification). */
export async function retrieveLemonSqueezyCheckout(
  config: LemonSqueezyClientConfig,
  checkoutId: string
): Promise<{ status: string | null }> {
  const res = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    cache: 'no-store',
  });
  const json = (await res.json()) as CheckoutRetrieveResponse;
  if (!res.ok) {
    throw new Error('Failed to retrieve checkout');
  }
  return { status: json.data?.attributes?.status ?? null };
}
