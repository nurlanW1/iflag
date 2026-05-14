import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify a Paddle Billing webhook signature.
 *
 * Header format:
 *   Paddle-Signature: ts=1671552777;h1=eb4d0dc8...
 *
 * The signed payload is `${ts}:${rawBody}` HMAC-SHA256-ed with the endpoint
 * signing secret. We also enforce a 5-minute freshness window to prevent
 * replay attacks.
 *
 * @see https://developer.paddle.com/webhooks/signature-verification
 */

const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

export interface SignatureVerifyResult {
  valid: boolean;
  reason?: 'missing-header' | 'malformed' | 'stale' | 'mismatch' | 'missing-secret';
  timestamp?: number;
}

function parseHeader(
  header: string
): { ts: number; h1: string } | null {
  // Expected: `ts=<unix>;h1=<hex>`. There can be additional algorithm fields
  // in the future — only the `h1` we know how to verify.
  const parts = header.split(';');
  let ts: number | null = null;
  let h1: string | null = null;
  for (const part of parts) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k === 'ts') {
      const n = parseInt(v, 10);
      if (Number.isFinite(n)) ts = n;
    } else if (k === 'h1') {
      h1 = v;
    }
  }
  if (ts === null || h1 === null) return null;
  return { ts, h1 };
}

export function verifyPaddleSignature(
  rawBody: Buffer | string,
  signatureHeader: string | null | undefined,
  signingSecret: string,
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS
): SignatureVerifyResult {
  if (!signingSecret) return { valid: false, reason: 'missing-secret' };
  if (!signatureHeader) return { valid: false, reason: 'missing-header' };

  const parsed = parseHeader(signatureHeader);
  if (!parsed) return { valid: false, reason: 'malformed' };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.ts) > toleranceSeconds) {
    return { valid: false, reason: 'stale', timestamp: parsed.ts };
  }

  const bodyBuffer = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(rawBody, 'utf8');

  const expectedHex = createHmac('sha256', signingSecret)
    .update(`${parsed.ts}:`)
    .update(bodyBuffer)
    .digest('hex');

  const expected = Buffer.from(expectedHex, 'utf8');
  const received = Buffer.from(parsed.h1, 'utf8');
  if (expected.length !== received.length) {
    return { valid: false, reason: 'mismatch', timestamp: parsed.ts };
  }
  try {
    const ok = timingSafeEqual(expected, received);
    return ok
      ? { valid: true, timestamp: parsed.ts }
      : { valid: false, reason: 'mismatch', timestamp: parsed.ts };
  } catch {
    return { valid: false, reason: 'mismatch', timestamp: parsed.ts };
  }
}
