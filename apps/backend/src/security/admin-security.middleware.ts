// Admin Security Middleware
// Comprehensive security middleware for admin routes

import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { rateLimitService } from './rate-limit.service.js';
import { rbacService } from '../auth/rbac.service.js';
import { auditLogService } from './audit-log.service.js';
import { v4 as uuidv4 } from 'uuid';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    mfaVerified: boolean;
  };
  requestId?: string;
}

/**
 * Extract IP address from request
 */
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return uuidv4();
}

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const ip = getClientIP(req);
  const userId = req.user?.id;

  // Global IP rate limit
  const ipLimit = await rateLimitService.limitByIP(ip, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  });

  if (!ipLimit.allowed) {
    await auditLogService.logRateLimitExceeded(
      ip,
      req.path,
      ip,
      getUserAgent(req)
    );

    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: ipLimit.retryAfter,
    });
  }

  // User-specific rate limit
  if (userId) {
    const userLimit = await rateLimitService.limitAdminOperations(userId);
    if (!userLimit.allowed) {
      await auditLogService.logRateLimitExceeded(
        userId,
        req.path,
        ip,
        getUserAgent(req)
      );

      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: userLimit.retryAfter,
      });
    }
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', ipLimit.resetTime);
  res.setHeader('X-RateLimit-Remaining', ipLimit.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(ipLimit.resetTime).toISOString());

  next();
}

/**
 * Authentication middleware
 */
export function authenticateAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = verify(token, secret) as any;

    // Verify MFA if required
    if (decoded.role === 'admin' || decoded.role === 'super_admin') {
      if (!decoded.mfaVerified) {
        return res.status(403).json({
          error: 'MFA verification required',
          requiresMFA: true,
        });
      }
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      mfaVerified: decoded.mfaVerified || false,
    };

    next();
  } catch (error) {
    // Log failed authentication
    auditLogService.logAuth(
      'login_failed',
      null,
      null,
      getClientIP(req),
      getUserAgent(req),
      'failure',
      { reason: 'Invalid token' }
    );

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware
 */
export function authorizePermission(permission: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = await rbacService.hasPermission(
      req.user.id,
      permission as any
    );

    if (!hasPermission) {
      // Log permission denied
      const resourceType = Array.isArray(req.params.resourceType) ? req.params.resourceType[0] : (req.params.resourceType || 'unknown');
      const resourceId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id || 'unknown');
      await auditLogService.logPermissionDenied(
        req.user.id,
        req.user.email,
        permission,
        resourceType,
        resourceId,
        getClientIP(req),
        getUserAgent(req)
      );

      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
      });
    }

    next();
  };
}

/**
 * Require role middleware
 */
export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      await auditLogService.logPermissionDenied(
        req.user.id,
        req.user.email,
        `require_role:${roles.join(',')}`,
        'system',
        'role_check',
        getClientIP(req),
        getUserAgent(req)
      );

      return res.status(403).json({
        error: 'Insufficient role',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
}

/**
 * Audit logging middleware
 */
export function auditLog(action: string, resourceType?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Generate request ID
    req.requestId = generateRequestId();
    res.setHeader('X-Request-ID', req.requestId);

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to capture response
    res.json = function (body: any) {
      // Log after response
      if (req.user) {
        auditLogService.log({
          action: action as any,
          user_id: req.user.id,
          user_email: req.user.email,
          resource_type: resourceType || (Array.isArray(req.params.resourceType) ? req.params.resourceType[0] : req.params.resourceType),
          resource_id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
          ip_address: getClientIP(req),
          user_agent: getUserAgent(req),
          request_id: req.requestId,
          status: res.statusCode < 400 ? 'success' : 'failure',
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          },
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Request ID middleware
 */
export function requestIdMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  req.requestId = req.headers['x-request-id'] as string || generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

/**
 * Combined admin security middleware
 */
export const adminSecurityMiddleware = [
  requestIdMiddleware,
  securityHeadersMiddleware,
  rateLimitMiddleware,
  authenticateAdmin,
];
