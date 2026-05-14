/**
 * MFA crypto helpers.
 *
 * - Derives a 32-byte AES key from `ENCRYPTION_KEY` env via scrypt.
 * - Encrypts the TOTP secret with AES-256-GCM; stores as
 *   `<ivHex>:<authTagHex>:<ciphertextHex>`.
 * - Hashes backup codes with sha256(hex). Codes are one-time use, so hashing
 *   is sufficient and prevents reuse on a DB leak.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_SCRYPT_SALT = 'mfa-secret-v1';

let cachedKey: Buffer | null = null;

function deriveKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw =
    process.env.ENCRYPTION_KEY?.trim() || process.env.JWT_SECRET?.trim();
  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY (or JWT_SECRET) must be set to derive the MFA encryption key. ' +
        'Use a long random string in production.'
    );
  }
  cachedKey = scryptSync(raw, KEY_SCRYPT_SALT, 32);
  return cachedKey;
}

export function encryptSecret(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12); // GCM standard nonce length
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':');
}

export function decryptSecret(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('encrypted secret: malformed (expected iv:tag:cipher)');
  }
  const [ivHex, tagHex, encHex] = parts;
  const key = deriveKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

/** Normalize a user-typed backup code (uppercase, strip spaces & dashes). */
export function normalizeBackupCode(input: string): string {
  return input.replace(/[\s-]+/g, '').toUpperCase();
}

export function hashBackupCode(code: string): string {
  return createHash('sha256').update(normalizeBackupCode(code)).digest('hex');
}

/** Generate `count` backup codes in `XXXX-XXXX` format. Returns plain + hashes. */
export function generateBackupCodes(count = 10): {
  plain: string[];
  hashes: string[];
} {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(4).toString('hex').toUpperCase(); // 8 chars
    const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    plain.push(code);
    hashes.push(hashBackupCode(code));
  }
  return { plain, hashes };
}
