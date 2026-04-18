import { NextResponse } from 'next/server';
import { verifyLemonSqueezySignature } from '@/lib/billing/lemonsqueezy-signature';
import { processLemonSqueezyWebhookPayload } from '@/lib/billing/lemonsqueezy-webhook-handlers';
import {
  markWebhookProcessed,
  wasWebhookProcessed,
  webhookIdempotencyKey,
} from '@/lib/billing/webhook-idempotency';

export const runtime = 'nodejs';

function buildIdempotencyKey(raw: string): string | null {
  try {
    const payload = JSON.parse(raw) as {
      meta?: { event_name?: string };
      data?: { type?: string; id?: string; attributes?: { updated_at?: string } };
    };
    const eventName = payload.meta?.event_name || 'unknown';
    const type = payload.data?.type || '';
    const id = payload.data?.id || '';
    const updatedAt = payload.data?.attributes?.updated_at || '';
    if (!id) return null;
    return webhookIdempotencyKey(['lemonsqueezy', eventName, type, id, updatedAt]);
  } catch {
    return null;
  }
}

/**
 * Lemon Squeezy webhooks — configure URL in LS dashboard (same origin as this Next app).
 * @see https://docs.lemonsqueezy.com/help/webhooks
 *
 * Production note: fulfillment uses the in-memory marketplace store. On multi-instance hosts
 * (e.g. serverless), persist orders, idempotency keys, and entitlements in a shared database
 * so webhooks and dashboard reads see the same data.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature');

  if (!verifyLemonSqueezySignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const idemKey = buildIdempotencyKey(raw);
  if (idemKey && wasWebhookProcessed(idemKey)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    processLemonSqueezyWebhookPayload(raw);
    if (idemKey) markWebhookProcessed(idemKey);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('LemonSqueezy webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
