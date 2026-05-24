import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClerkClient, verifyToken } from '@clerk/backend';
import {
  getUserById,
  resolveOrProvisionUserForClerkBridge,
} from './auth.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Extract token from Authorization header
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Verify JWT token
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // Verify user still exists and is active
    const user = await getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Require admin role
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };

      const user = await getUserById(decoded.userId);
      if (user) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
}

/**
 * Billing checkout: accepts our HS256 JWT (Next proxy + cookies) OR a Clerk session JWT from
 * `getToken()` (Authorization Bearer). Clerk path mirrors `/auth/bridge/clerk-session` resolution.
 */
export async function authenticateAppJwtOrClerkBilling(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
    return;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (!(err instanceof jwt.JsonWebTokenError)) {
      console.error('[auth] Unexpected JWT verification error (billing path):', err);
      res.status(500).json({ error: 'Authentication error' });
      return;
    }
  }

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    res.status(503).json({
      error: 'Clerk is not configured on the billing API',
      code: 'CLERK_AUTH_UNAVAILABLE',
    });
    return;
  }

  let clerkUserId: string;
  try {
    const payload = await verifyToken(token, { secretKey });
    if (!payload?.sub) {
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_CLERK_TOKEN' });
      return;
    }
    clerkUserId = payload.sub;
  } catch (e) {
    console.error('[auth] Clerk verifyToken failed (billing path):', e);
    res.status(401).json({ error: 'Invalid token', code: 'INVALID_CLERK_TOKEN' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey });
    const cUser = await clerk.users.getUser(clerkUserId);

    const primaryId = cUser.primaryEmailAddressId;
    const email =
      cUser.emailAddresses.find((row) => row.id === primaryId)?.emailAddress ??
      cUser.emailAddresses[0]?.emailAddress ??
      '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({
        error: 'Your Clerk profile must have an email address to use checkout',
        code: 'CLERK_EMAIL_MISSING',
      });
      return;
    }

    const addr = primaryId
      ? cUser.emailAddresses.find((row) => row.id === primaryId)
      : cUser.emailAddresses[0];
    const verified = addr?.verification?.status === 'verified';

    const full_name =
      cUser.fullName?.trim() ||
      [cUser.firstName, cUser.lastName].filter(Boolean).join(' ').trim() ||
      null;

    const resolved = await resolveOrProvisionUserForClerkBridge({
      email,
      full_name,
      email_verified: verified,
    });

    if (!resolved.ok) {
      res.status(403).json({
        error:
          'This account has MFA enabled. Sign in with email and password (and MFA) to use Paddle billing.',
        code: resolved.code,
      });
      return;
    }

    req.user = {
      userId: resolved.user.id,
      email: resolved.user.email,
      role: resolved.user.role,
    };

    next();
  } catch (e) {
    console.error('[auth] Clerk billing user resolution failed:', e);
    const message = e instanceof Error ? e.message : 'Clerk user resolution failed';
    res.status(500).json({
      error: 'Authentication error',
      code: 'CLERK_USER_RESOLUTION_FAILED',
      detail: process.env.NODE_ENV === 'production' ? undefined : message,
    });
  }
}
