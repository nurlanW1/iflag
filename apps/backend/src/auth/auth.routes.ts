/**
 * Auth routes.
 *
 *   POST /register                    Create account + send verification email
 *   POST /login                       Issue JWT + refresh token
 *   POST /refresh                     Rotate access token
 *   POST /logout                      Revoke refresh token (authenticated)
 *   GET  /me                          Current user
 *   PUT  /me                          Update profile (full_name)
 *
 *   GET  /verify-email                Consume token (link-style)
 *   POST /verify-email                Consume token (JSON body)
 *   POST /resend-verification         Resend verification email (authenticated)
 *
 *   POST /forgot-password             Send password reset email (always 200)
 *   POST /reset-password              Consume reset token + set new password
 *   POST /change-password             Authenticated password change
 *
 *   POST /bridge/clerk-session        Internal: Clerk identity → JWT (X-Internal-Bridge-Secret)
 */

import express, { type Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
  updateUserProfile,
  issueSessionTokens,
  resolveOrProvisionUserForClerkBridge,
} from './auth.service.js';
import {
  authenticateToken,
  type AuthRequest,
} from './auth.middleware.js';
import {
  sendVerificationEmail,
  consumeVerificationToken,
} from './email-verification.service.js';
import {
  requestPasswordReset,
  resetPassword,
  changePassword,
} from './password-reset.service.js';
import { issueChallenge } from './mfa.service.js';
import mfaRouter from './mfa.routes.js';

const router = express.Router();

// MFA endpoints live under /api/auth/mfa/* — mount the sub-router first so
// rate limiters / global middleware apply cleanly.
router.use('/mfa', mfaRouter);

function clientMeta(req: AuthRequest) {
  return {
    ipAddress:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      undefined,
    userAgent: (req.headers['user-agent'] as string) || undefined,
  };
}

function isEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// ---------------------------------------------------------------------------
// Registration / session
// ---------------------------------------------------------------------------

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name } = req.body || {};

    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await registerUser({ email, password, full_name });

    // Fire verification email (non-blocking failure — registration still succeeds).
    sendVerificationEmail({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      ...clientMeta(req),
    }).catch((e) => console.error('[auth] verification email failed:', e));

    res.status(201).json({
      message: 'User registered successfully. Check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        email_verified: user.email_verified,
      },
    });
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Internal-only: trusted frontend exchanges a verified Clerk identity for backend JWT cookies.
 * Header X-Internal-Bridge-Secret must match INTERNAL_AUTH_BRIDGE_SECRET (shared between servers).
 */
router.post('/bridge/clerk-session', async (req: AuthRequest, res: Response) => {
  try {
    const expected = process.env.INTERNAL_AUTH_BRIDGE_SECRET?.trim();
    if (!expected) {
      return res.status(503).json({ error: 'Clerk bridge is not configured on the server' });
    }
    const secret = (req.headers['x-internal-bridge-secret'] as string | undefined)?.trim();
    if (!secret || secret !== expected) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, email_verified } = req.body || {};
    const rawFull = (req.body as { full_name?: unknown })?.full_name;
    const full_name = typeof rawFull === 'string' ? rawFull.trim() || null : null;

    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const resolved = await resolveOrProvisionUserForClerkBridge({
      email,
      full_name,
      email_verified: Boolean(email_verified),
      clerkIdentityVerified: true,
    });

    if (!resolved.ok) {
      return res.status(403).json({
        error:
          'This account has MFA enabled. Sign in with email and password (and MFA) to use Paddle billing.',
        code: resolved.code,
      });
    }

    const tokens = await issueSessionTokens(resolved.user);
    res.json(tokens);
  } catch (error: unknown) {
    console.error('[auth] clerk bridge error:', error);
    res.status(500).json({ error: 'Bridge exchange failed' });
  }
});

router.post('/login', async (req: AuthRequest, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isEmail(email) || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await loginUser({ email, password });

    if ('mfa_required' in result && result.mfa_required) {
      const { token, expiresAt } = await issueChallenge(result.user_id, clientMeta(req));
      return res.json({
        mfa_required: true,
        challenge_token: token,
        expires_at: expiresAt,
        message: 'MFA verification required. POST /api/auth/mfa/verify with this token + code.',
      });
    }

    res.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    const { accessToken } = await refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (error: any) {
    if (error.message === 'Invalid refresh token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await logoutUser(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      email_verified: user.email_verified,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { full_name } = req.body || {};
    const patch: { full_name?: string | null } = {};
    if (full_name !== undefined) {
      if (full_name !== null && typeof full_name !== 'string') {
        return res.status(400).json({ error: 'full_name must be a string or null' });
      }
      if (typeof full_name === 'string' && full_name.length > 255) {
        return res.status(400).json({ error: 'full_name too long (max 255)' });
      }
      patch.full_name = full_name;
    }
    const user = await updateUserProfile(req.user!.userId, patch);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      email_verified: user.email_verified,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

/**
 * GET /verify-email?token=...
 * Convenience link target. Returns 200 JSON or 400 — frontend can show its own
 * success/failure UI.
 */
router.get('/verify-email', async (req, res) => {
  try {
    const token = (req.query.token as string) || '';
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    const userId = await consumeVerificationToken(token);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    res.json({ verified: true, user_id: userId });
  } catch (err) {
    console.error('Verify-email error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/** Same as GET but accepts JSON body. */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    const userId = await consumeVerificationToken(token);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    res.json({ verified: true, user_id: userId });
  } catch (err) {
    console.error('Verify-email error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /resend-verification
 * Authenticated — sends a new verification email to the current user.
 * Returns 200/202 always to avoid email-existence leakage.
 */
router.post('/resend-verification', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.email_verified) {
      return res.json({ ok: true, already_verified: true });
    }

    const result = await sendVerificationEmail({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      ...clientMeta(req),
    });
    res.status(result.cooldown ? 429 : 202).json({
      ok: !result.cooldown,
      cooldown: !!result.cooldown,
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

router.post('/forgot-password', async (req: AuthRequest, res) => {
  try {
    const { email } = req.body || {};
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    await requestPasswordReset(email, clientMeta(req));
    // Always 200 — never reveal whether the email exists.
    res.json({
      ok: true,
      message: 'If that account exists, a reset email has been sent.',
    });
  } catch (err) {
    console.error('Forgot-password error:', err);
    // Still 200 (don't leak via 500).
    res.json({
      ok: true,
      message: 'If that account exists, a reset email has been sent.',
    });
  }
});

router.post('/reset-password', async (req: AuthRequest, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required' });
    }
    const result = await resetPassword(token, password, clientMeta(req));
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ ok: true, user_id: result.userId });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'currentPassword and newPassword are required',
      });
    }
    const result = await changePassword(
      req.user!.userId,
      currentPassword,
      newPassword,
      clientMeta(req)
    );
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Change-password error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

export default router;
