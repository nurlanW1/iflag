/**
 * Password reset workflow.
 *
 *   1. requestPasswordReset(email) — generates a hashed token, emails the user.
 *      Always returns 200 (no user-existence leakage).
 *   2. resetPassword(token, newPassword) — verifies, hashes new password,
 *      revokes all refresh tokens, sends a "password changed" notice.
 *   3. changePassword(userId, currentPw, newPw) — authenticated path that
 *      requires the current password.
 *
 * Tokens are stored as sha256(hex). Lifetime defaults to 30 minutes.
 */

import { createHash, randomBytes } from 'crypto';
import pool from '../db.js';
import { hashPassword, verifyPassword, deleteAllRefreshTokens } from './auth.service.js';
import { sendMail } from '../mailer/mailer.service.js';
import {
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
} from '../mailer/templates.js';
import { getMailerConfig } from '../mailer/mailer.config.js';

const TOKEN_TTL_MINUTES = parseInt(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || '30',
  10
);

const MIN_PASSWORD_LENGTH = parseInt(
  process.env.MIN_PASSWORD_LENGTH || '8',
  10
);

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function generateRawToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Always returns success. If the email exists, we send a reset email; if not,
 * we silently no-op. This prevents account-enumeration attacks.
 */
export async function requestPasswordReset(
  email: string,
  meta: { ipAddress?: string; userAgent?: string } = {}
): Promise<{ accepted: true }> {
  const userRow = await pool.query(
    'SELECT id, email, full_name FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1',
    [email]
  );
  if (userRow.rows.length === 0) {
    return { accepted: true };
  }
  const user = userRow.rows[0];

  // Throttle: at most 3 outstanding reset tokens per user in last 15 min.
  const recent = await pool.query(
    `SELECT COUNT(*)::int AS n
       FROM password_reset_tokens
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '15 minutes'`,
    [user.id]
  );
  if (recent.rows[0].n >= 3) {
    return { accepted: true };
  }

  const rawToken = generateRawToken();
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

  await pool.query(
    `INSERT INTO password_reset_tokens
        (user_id, token_hash, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      tokenHash,
      expiresAt,
      meta.ipAddress || null,
      meta.userAgent || null,
    ]
  );

  const cfg = getMailerConfig();
  const resetUrl = `${cfg.publicFrontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const rendered = renderPasswordResetEmail({
    fullName: user.full_name,
    resetUrl,
    expiresInMinutes: TOKEN_TTL_MINUTES,
    ipAddress: meta.ipAddress,
  });

  await sendMail({
    to: user.email,
    toName: user.full_name ?? undefined,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    template: 'password-reset',
    metadata: { user_id: user.id, ip_address: meta.ipAddress || null },
  });

  return { accepted: true };
}

/**
 * Consume the reset token, update the password, and revoke all refresh
 * tokens so existing sessions are forced to re-authenticate.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
  meta: { ipAddress?: string } = {}
): Promise<{ ok: boolean; userId?: string; error?: string }> {
  if (typeof rawToken !== 'string' || rawToken.length < 32) {
    return { ok: false, error: 'invalid token' };
  }
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  const tokenHash = sha256Hex(rawToken);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const row = await client.query(
      `SELECT id, user_id, expires_at, consumed_at
         FROM password_reset_tokens
        WHERE token_hash = $1
        FOR UPDATE`,
      [tokenHash]
    );
    if (row.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'invalid token' };
    }
    const t = row.rows[0];
    if (t.consumed_at) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'token already used' };
    }
    if (new Date(t.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'token expired' };
    }

    const hash = await hashPassword(newPassword);
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hash, t.user_id]
    );
    await client.query(
      'UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1',
      [t.id]
    );

    await client.query('COMMIT');

    // Revoke all refresh tokens (any existing sessions must re-auth).
    await deleteAllRefreshTokens(t.user_id);

    // Send the "password changed" notice (best-effort).
    const userRow = await pool.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [t.user_id]
    );
    if (userRow.rows.length > 0) {
      const u = userRow.rows[0];
      const rendered = renderPasswordChangedEmail({
        fullName: u.full_name,
        ipAddress: meta.ipAddress,
        occurredAt: new Date(),
      });
      sendMail({
        to: u.email,
        toName: u.full_name ?? undefined,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        template: 'password-changed',
        metadata: { user_id: t.user_id, ip_address: meta.ipAddress || null },
      }).catch((e) => console.error('[password-reset] notice email failed:', e));
    }

    return { ok: true, userId: t.user_id };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Authenticated password change. Requires the current password to be supplied.
 * Revokes all other sessions on success.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  meta: { ipAddress?: string } = {}
): Promise<{ ok: boolean; error?: string }> {
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }
  if (newPassword === currentPassword) {
    return { ok: false, error: 'new password must differ from current' };
  }

  const userRow = await pool.query(
    'SELECT password_hash, email, full_name FROM users WHERE id = $1 AND is_active = TRUE',
    [userId]
  );
  if (userRow.rows.length === 0) {
    return { ok: false, error: 'user not found' };
  }
  const u = userRow.rows[0];

  const valid = await verifyPassword(currentPassword, u.password_hash);
  if (!valid) {
    return { ok: false, error: 'current password incorrect' };
  }

  const newHash = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newHash, userId]
  );

  await deleteAllRefreshTokens(userId);

  const rendered = renderPasswordChangedEmail({
    fullName: u.full_name,
    ipAddress: meta.ipAddress,
    occurredAt: new Date(),
  });
  sendMail({
    to: u.email,
    toName: u.full_name ?? undefined,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    template: 'password-changed',
    metadata: { user_id: userId, ip_address: meta.ipAddress || null },
  }).catch((e) => console.error('[change-password] notice email failed:', e));

  return { ok: true };
}
