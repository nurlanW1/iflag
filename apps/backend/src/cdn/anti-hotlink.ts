// Anti-Hotlinking Service
// Validates requests to prevent unauthorized embedding

import { verify } from 'jsonwebtoken';

export interface HotlinkConfig {
  allowedDomains: string[];
  requireToken: boolean;
  tokenSecret: string;
  allowEmptyReferer: boolean;
}

export interface RequestContext {
  referer?: string;
  origin?: string;
  userAgent?: string;
  token?: string;
  ip?: string;
}

export class AntiHotlinkService {
  private config: HotlinkConfig;

  constructor(config: HotlinkConfig) {
    this.config = config;
  }

  /**
   * Validate request and check for hotlinking
   */
  validateRequest(context: RequestContext): {
    allowed: boolean;
    reason?: string;
  } {
    // If token is required, validate it first
    if (this.config.requireToken) {
      if (!context.token) {
        return {
          allowed: false,
          reason: 'Token required',
        };
      }

      const tokenValid = this.validateToken(context.token);
      if (!tokenValid) {
        return {
          allowed: false,
          reason: 'Invalid token',
        };
      }
    }

    // Check referer
    const referer = context.referer || context.origin;
    
    if (!referer) {
      if (this.config.allowEmptyReferer) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Referer required',
      };
    }

    // Check if referer is from allowed domain
    const isAllowed = this.config.allowedDomains.some(domain => {
      try {
        const refererUrl = new URL(referer);
        return refererUrl.hostname === domain || 
               refererUrl.hostname.endsWith(`.${domain}`);
      } catch {
        return referer.includes(domain);
      }
    });

    if (!isAllowed) {
      return {
        allowed: false,
        reason: 'Hotlinking not allowed',
      };
    }

    return { allowed: true };
  }

  /**
   * Validate JWT token
   */
  private validateToken(token: string): boolean {
    try {
      const decoded = verify(token, this.config.tokenSecret);
      return !!decoded;
    } catch {
      return false;
    }
  }

  /**
   * Generate token for asset access
   */
  generateToken(payload: {
    assetId: string;
    userId?: string;
    formatId: string;
    type: 'free' | 'premium' | 'watermarked';
    expiresIn?: number;
  }): string {
    const jwt = require('jsonwebtoken');
    
    return jwt.sign(
      {
        asset_id: payload.assetId,
        user_id: payload.userId,
        format_id: payload.formatId,
        type: payload.type,
      },
      this.config.tokenSecret,
      {
        expiresIn: payload.expiresIn || '15m',
      }
    );
  }

  /**
   * Extract token from URL
   */
  extractTokenFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('token') || null;
    } catch {
      return null;
    }
  }
}

// Lambda@Edge function for CloudFront
export const cloudfrontAntiHotlink = async (event: any) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const referer = headers['referer']?.[0]?.value || 
                  headers['origin']?.[0]?.value || '';
  const token = new URL(`https://example.com${request.uri}?${request.querystring}`)
    .searchParams.get('token');

  const config: HotlinkConfig = {
    allowedDomains: [
      process.env.ALLOWED_DOMAIN || 'flagstock.com',
      'www.flagstock.com',
      'admin.flagstock.com',
    ],
    requireToken: process.env.REQUIRE_TOKEN === 'true',
    tokenSecret: process.env.TOKEN_SECRET || '',
    allowEmptyReferer: process.env.ALLOW_EMPTY_REFERER === 'true',
  };

  const service = new AntiHotlinkService(config);
  const validation = service.validateRequest({
    referer,
    token: token || undefined,
  });

  if (!validation.allowed) {
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: validation.reason || 'Access denied',
      headers: {
        'content-type': [{ value: 'text/plain' }],
      },
    };
  }

  return request;
};

// Cloudflare Worker function
export const cloudflareAntiHotlink = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const referer = request.headers.get('referer') || request.headers.get('origin') || '';
  const token = url.searchParams.get('token');

  const config: HotlinkConfig = {
    allowedDomains: [
      'flagstock.com',
      'www.flagstock.com',
      'admin.flagstock.com',
    ],
    requireToken: false, // Can be enabled if needed
    tokenSecret: '', // Set via environment variable
    allowEmptyReferer: false,
  };

  const service = new AntiHotlinkService(config);
  const validation = service.validateRequest({
    referer,
    token: token || undefined,
  });

  if (!validation.allowed) {
    return new Response(validation.reason || 'Access denied', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Forward request to origin
  return fetch(request);
};
