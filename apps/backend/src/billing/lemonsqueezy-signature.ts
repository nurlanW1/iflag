import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify Lemon Squeezy webhook `X-Signature` header.
 * @see https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 *
 * Header format: lowercase hex HMAC-SHA256 of the raw body using the
 * webhook signing secret.
 *
 * Constant-time comparison: never use `==`.
 */
export function verifyLemonSqueezySignature(
  rawBody: Buffer | string,
  signatureHeader: string | null | undefined,
  signingSecret: string
): boolean {
  if (!signatureHeader || !signingSecret) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const expectedHex = createHmac('sha256', signingSecret).update(body).digest('hex');

  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  const receivedBuf = Buffer.from(signatureHeader.trim(), 'utf8');

  if (expectedBuf.length !== receivedBuf.length) return false;
  try {
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}
