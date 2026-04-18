import crypto from 'node:crypto';

/**
 * Verify Lemon Squeezy webhook X-Signature (HMAC SHA256 hex of raw body).
 * @see https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */
export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_SIGNING_SECRET?.trim();
  if (!secret || !signatureHeader) return false;

  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const digestBuf = Buffer.from(digest, 'utf8');
  const sigBuf = Buffer.from(signatureHeader.trim(), 'utf8');

  if (digestBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(digestBuf, sigBuf);
}
