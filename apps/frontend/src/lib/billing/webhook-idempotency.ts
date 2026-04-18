/**
 * In-process deduplication for Lemon Squeezy webhooks.
 * Production: persist keys (e.g. webhook_deliveries table with UNIQUE(provider, idempotency_key)).
 */

const processedKeys = new Set<string>();

export function webhookIdempotencyKey(parts: string[]): string {
  return parts.join(':');
}

export function wasWebhookProcessed(key: string): boolean {
  return processedKeys.has(key);
}

export function markWebhookProcessed(key: string): void {
  processedKeys.add(key);
}
