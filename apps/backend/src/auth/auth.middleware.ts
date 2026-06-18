import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClerkClient, verifyToken } from '@clerk/backend';
import {
  getUserById,
  resolveUserForVerifiedClerkBilling,
} from './auth.service.js';
import { verifyClerkAdminBearer } from './clerk-admin.server.js';

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

// Verify JWT token — also accepts Clerk session tokens when CLERK_SECRET_KEY is set.
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Try Clerk first (preferred when CLERK_SECRET_KEY is configured)
  const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (clerkSecretKey) {
    try {
      const payload = await verifyToken(token, { secretKey: clerkSecretKey });
      if (payload?.sub) {
        // Valid Clerk token — gate against admin allow-list
        const gate = await verifyClerkAdminBearer(`Bearer ${token}`);
        if (gate.ok) {
          req.user = { userId: gate.userId, email: gate.email, role: 'admin' };
          next();
          return;
        }
        // Clerk token is valid but email not in admin allow-list
        res.status(403).json({ error: 'Admin access required', code: 'forbidden' });
        return;
      }
    } catch {
      // Not a Clerk token — fall through to legacy JWT
    }
  }

  // Legacy app JWT path
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
async function attachVerifiedClerkBillingUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  clerkUserId: string,
  secretKey: string,
): Promise<void> {
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

    const user = await resolveUserForVerifiedClerkBilling({
      email,
      full_name,
      email_verified: verified,
    });

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
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

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (secretKey) {
    try {
      const payload = await verifyToken(token, { secretKey });
      if (payload?.sub) {
        await attachVerifiedClerkBillingUser(req, res, next, payload.sub, secretKey);
        return;
      }
    } catch {
      /* Not a Clerk session token — fall through to app JWT. */
    }
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
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }
    console.error('[auth] Unexpected JWT verification error (billing path):', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}
