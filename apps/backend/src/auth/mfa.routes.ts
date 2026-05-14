/**
 * MFA routes (mounted under /api/auth/mfa).
 *
 *   GET    /status                       Current MFA state for caller (auth)
 *   POST   /setup                        Start enrollment (auth, returns QR + backup codes)
 *   POST   /enroll                       Confirm enrollment with first TOTP code (auth)
 *   POST   /verify                       PUBLIC — exchange challenge token + code for tokens
 *   POST   /disable                      Disable MFA (auth, requires password)
 *   POST   /backup-codes/regenerate      Rotate backup codes (auth, requires password)
 */

import express, { type Response } from 'express';
import {
  authenticateToken,
  type AuthRequest,
} from './auth.middleware.js';
import {
  getMfaStatus,
  setupMfa,
  confirmEnrollment,
  verifyChallenge,
  disableMfa,
  rotateBackupCodes,
} from './mfa.service.js';
import { getUserById, issueSessionTokens } from './auth.service.js';

const router = express.Router();

function sendError(res: Response, err: any, fallback = 500) {
  const status =
    typeof err?.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : fallback;
  if (status >= 500) console.error('[mfa] route error:', err);
  res.status(status).json({ error: err?.message || 'MFA error' });
}

// ---------------------------------------------------------------------------
// Public — challenge verification (used during login phase 2)
// ---------------------------------------------------------------------------

router.post('/verify', async (req, res) => {
  try {
    const { challengeToken, code } = req.body || {};
    if (typeof challengeToken !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ error: 'challengeToken and code are required' });
    }

    const { userId } = await verifyChallenge(challengeToken, code);

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists' });
    }

    // Issue real tokens now that MFA succeeded.
    const tokens = await issueSessionTokens(user);

    // Treat this as a completed login.
    await import('../db.js').then(({ default: pool }) =>
      pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [
        userId,
      ])
    );

    res.json(tokens);
  } catch (err) {
    sendError(res, err, 401);
  }
});

// ---------------------------------------------------------------------------
// Authenticated routes
// ---------------------------------------------------------------------------

router.use(authenticateToken);

router.get('/status', async (req: AuthRequest, res) => {
  try {
    const status = await getMfaStatus(req.user!.userId);
    res.json(status);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/setup', async (req: AuthRequest, res) => {
  try {
    const setup = await setupMfa(req.user!.userId, req.user!.email);
    res.json({
      secret: setup.secret,
      otpauth_url: setup.otpauth_url,
      qr_code_data_url: setup.qr_code_data_url,
      backup_codes: setup.backup_codes,
      expires_at: setup.expires_at,
      message:
        'Scan the QR with your authenticator app, then call /mfa/enroll with the first code shown. ' +
        'Backup codes are shown only once — store them safely.',
    });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/enroll', async (req: AuthRequest, res) => {
  try {
    const { code } = req.body || {};
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required' });
    }
    const result = await confirmEnrollment(req.user!.userId, code);
    res.json({ ok: true, ...result });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/disable', async (req: AuthRequest, res) => {
  try {
    const { password } = req.body || {};
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'password is required' });
    }
    const ok = await disableMfa(req.user!.userId, password);
    if (!ok) return res.status(401).json({ error: 'Invalid password' });
    res.json({ ok: true, enabled: false });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/backup-codes/regenerate', async (req: AuthRequest, res) => {
  try {
    const { password } = req.body || {};
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'password is required' });
    }
    const result = await rotateBackupCodes(req.user!.userId, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid password or MFA not enabled' });
    }
    res.json({
      ok: true,
      backup_codes: result.codes,
      message: 'New backup codes generated. The previous codes are now invalid.',
    });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
