// Cloudflare Worker for Anti-Hotlinking and Token Validation
// Deploy this to Cloudflare Workers

/**
 * Cloudflare Worker for asset delivery with anti-hotlinking
 * 
 * Environment Variables:
 * - ALLOWED_DOMAINS: Comma-separated list of allowed domains
 * - TOKEN_SECRET: Secret for JWT token validation
 * - REQUIRE_TOKEN: Whether token is required (true/false)
 * - ORIGIN_URL: Origin S3 bucket URL
 */

interface Env {
  ALLOWED_DOMAINS: string;
  TOKEN_SECRET: string;
  REQUIRE_TOKEN?: string;
  ORIGIN_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only handle asset requests
    if (!url.pathname.startsWith('/vectors/') && 
        !url.pathname.startsWith('/rasters/') && 
        !url.pathname.startsWith('/videos/')) {
      return fetch(request);
    }

    // Extract token
    const token = url.searchParams.get('token');
    const referer = request.headers.get('referer') || 
                    request.headers.get('origin') || '';

    // Validate referer
    const allowedDomains = env.ALLOWED_DOMAINS.split(',').map(d => d.trim());
    const isAllowedDomain = allowedDomains.some(domain => {
      try {
        if (!referer) return false;
        const refererUrl = new URL(referer);
        return refererUrl.hostname === domain || 
               refererUrl.hostname.endsWith(`.${domain}`);
      } catch {
        return referer.includes(domain);
      }
    });

    // Check if token is required
    const requireToken = env.REQUIRE_TOKEN === 'true';
    if (requireToken && !token) {
      return new Response('Token required', { status: 403 });
    }

    // Validate token if present
    if (token) {
      try {
        const jwt = await import('jwt');
        const payload = jwt.verify(token, env.TOKEN_SECRET);
        
        // Check expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return new Response('Token expired', { status: 403 });
        }
      } catch (error) {
        return new Response('Invalid token', { status: 403 });
      }
    }

    // Check referer if not empty
    if (referer && !isAllowedDomain) {
      return new Response('Hotlinking not allowed', { status: 403 });
    }

    // Forward request to origin
    const originUrl = new URL(url.pathname + url.search, env.ORIGIN_URL);
    const originRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers: request.headers,
    });

    const response = await fetch(originRequest);

    // Add CORS headers
    const corsHeaders = new Headers(response.headers);
    corsHeaders.set('Access-Control-Allow-Origin', allowedDomains[0]);
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD');
    corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders,
    });
  },
};
