// Lambda@Edge function for CloudFront anti-hotlinking
// Deploy this to AWS Lambda@Edge

/**
 * Lambda@Edge function for CloudFront
 * Validates requests and prevents hotlinking
 * 
 * Environment Variables (set in Lambda console):
 * - ALLOWED_DOMAINS: Comma-separated list
 * - TOKEN_SECRET: JWT secret
 * - REQUIRE_TOKEN: true/false
 */

exports.handler = async (event: any) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Extract referer and origin
  const referer = headers['referer']?.[0]?.value || 
                  headers['origin']?.[0]?.value || '';
  
  // Extract token from query string
  const querystring = request.querystring || '';
  const tokenMatch = querystring.match(/token=([^&]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  // Get configuration from environment
  const allowedDomains = (process.env.ALLOWED_DOMAINS || 'flagstock.com,www.flagstock.com')
    .split(',')
    .map((d: string) => d.trim());
  
  const requireToken = process.env.REQUIRE_TOKEN === 'true';
  const tokenSecret = process.env.TOKEN_SECRET || '';

  // Check if token is required
  if (requireToken && !token) {
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Token required',
      headers: {
        'content-type': [{ value: 'text/plain' }],
      },
    };
  }

  // Validate token if present
  if (token && tokenSecret) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, tokenSecret);
      
      // Check expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return {
          status: '403',
          statusDescription: 'Forbidden',
          body: 'Token expired',
          headers: {
            'content-type': [{ value: 'text/plain' }],
          },
        };
      }
    } catch (error) {
      return {
        status: '403',
        statusDescription: 'Forbidden',
        body: 'Invalid token',
        headers: {
          'content-type': [{ value: 'text/plain' }],
        },
      };
    }
  }

  // Check referer
  if (referer) {
    let isAllowed = false;
    
    for (const domain of allowedDomains) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.hostname === domain || 
            refererUrl.hostname.endsWith(`.${domain}`)) {
          isAllowed = true;
          break;
        }
      } catch {
        if (referer.includes(domain)) {
          isAllowed = true;
          break;
        }
      }
    }

    if (!isAllowed) {
      return {
        status: '403',
        statusDescription: 'Forbidden',
        body: 'Hotlinking not allowed',
        headers: {
          'content-type': [{ value: 'text/plain' }],
        },
      };
    }
  }

  // Allow request to proceed
  return request;
};
