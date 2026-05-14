/**
 * Email verification workflow.
 *
 *   1. createVerificationToken(userId) → returns the RAW token (sent in email).
 *   2. Token hash + expiry are persisted in `email_verification_tokens`.
 *   3. consumeVerificationToken(token) → marks the row consumed and flips
 *      `users.email_verified` to TRUE.
 *
 * Tokens are stored as sha256(hex) — never plaintext.
 */

import { createHash, randomBytes } from 'crypto';
import pool from '../db.js';
import { sendMail } from '../mailer/mailer.service.js';
import { renderVerifyEmail } from '../mailer/templates.js';
import { getMailerConfig } from '../mailer/mailer.config.js';

const TOKEN_TTL_HOURS = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS || '24',
  10
);

// Anti-abuse: don't spam the same address.
const RESEND_COOLDOWN_SECONDS = parseInt(
  process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || '60',
  10
);

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function generateRawToken(): string {
  return randomBytes(32).toString('hex'); // 64 chars
}

/**
 * Create + persist a new verification token. Returns the raw token (use it
 * for the email link). Invalidates older outstanding tokens for the same user.
 */
export async function createVerificationToken(
  userId: string,
  email: string,
  meta: { ipAddress?: string; userAgent?: string } = {}
): Promise<{ rawToken: string; expiresAt: Date }> {
  // Invalidate previous outstanding tokens (one active verify link per user).
  await pool.query(
    `UPDATE email_verification_tokens
        SET consumed_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND consumed_at IS NULL`,
    [userId]
  );

  const rawToken = generateRawToken();
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000);

  await pool.query(
    `INSERT INTO email_verification_tokens
        (user_id, token_hash, email, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      tokenHash,
      email,
      expiresAt,
      meta.ipAddress || null,
      meta.userAgent || null,
    ]
  );

  return { rawToken, expiresAt };
}

/** Compose link + send email. Safe to call after registration or via resend. */
export async function sendVerificationEmail(args: {
  userId: string;
  email: string;
  fullName?: string | null;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ sent: boolean; outboxId?: string; cooldown?: boolean }> {
  // Cooldown check: refuse if we issued a token in the last N seconds.
  const recent = await pool.query(
    `SELECT 1 FROM email_verification_tokens
      WHERE user_id = $1
        AND created_at > NOW() - ($2::int * INTERVAL '1 second')
        AND consumed_at IS NULL
      LIMIT 1`,
    [args.userId, RESEND_COOLDOWN_SECONDS]
  );
  if (recent.rows.length > 0) {
    return { sent: false, cooldown: true };
  }

  const { rawToken, expiresAt } = await createVerificationToken(
    args.userId,
    args.email,
    { ipAddress: args.ipAddress, userAgent: args.userAgent }
  );

  const cfg = getMailerConfig();
  const verifyUrl = `${cfg.publicFrontendUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const rendered = renderVerifyEmail({
    fullName: args.fullName ?? null,
    verifyUrl,
    expiresInHours: TOKEN_TTL_HOURS,
  });

  const result = await sendMail({
    to: args.email,
    toName: args.fullName ?? undefined,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    template: 'verify-email',
    metadata: { user_id: args.userId, expires_at: expiresAt.toISOString() },
  });

  return { sent: result.status === 'sent', outboxId: result.outboxId };
}

/**
 * Consume a verification token. Returns the user_id on success, null on
 * invalid/expired/already-consumed.
 */
export async function consumeVerificationToken(
  rawToken: string
): Promise<string | null> {
  if (typeof rawToken !== 'string' || rawToken.length < 32) return null;
  const tokenHash = sha256Hex(rawToken);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const row = await client.query(
      `SELECT id, user_id, email, expires_at, consumed_at
         FROM email_verification_tokens
        WHERE token_hash = $1
        FOR UPDATE`,
      [tokenHash]
    );

    if (row.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const t = row.rows[0];
    if (t.consumed_at) {
      await client.query('ROLLBACK');
      return null;
    }
    if (new Date(t.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE email_verification_tokens
          SET consumed_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [t.id]
    );
    await client.query(
      `UPDATE users
          SET email_verified = TRUE,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [t.user_id]
    );

    await client.query('COMMIT');
    return t.user_id as string;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
