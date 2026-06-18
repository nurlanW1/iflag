import express, { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import crypto from 'crypto';
import pool from '../db.js';

const router = express.Router();

// ── CORS: all origins for public API endpoints ──────────────────────────────
router.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-API-Key, Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// ── Simple in-memory rate limiter (IP, 100 req/day) ────────────────────────
interface RateBucket {
  count: number;
  resetAt: number;
}
const ipRateBuckets = new Map<string, RateBucket>();
const API_KEY_DAILY_LIMITS: Record<string, number> = {
  free: 100,
  basic: 1000,
  pro: 10000,
  enterprise: Infinity,
};

function checkIpRateLimit(req: Request, res: Response): boolean {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown';
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const bucket = ipRateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipRateBuckets.set(ip, { count: 1, resetAt: now + dayMs });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > 100) {
    res.status(429).json({
      error: 'Rate limit exceeded. Max 100 requests/day on the free tier. Get an API key for higher limits.',
      upgrade_url: 'https://flagswing.com/developers/api-keys',
    });
    return false;
  }
  return true;
}

// ── Helper: extract Clerk user id from Bearer token ─────────────────────────
async function clerkUserIdFromBearer(req: Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return null;
  try {
    const payload = await verifyToken(token, { secretKey });
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

// ── CDN base URL ─────────────────────────────────────────────────────────────
function cdnBase(): string {
  return (process.env.R2_PUBLIC_BASE_URL ?? 'https://cdn.flagswing.com').replace(/\/$/, '');
}

function buildFormats(code: string): { svg: string; png: string; eps: string } {
  const base = cdnBase();
  return {
    svg: `${base}/flags/svg/${code}.svg`,
    png: `${base}/flags/png/${code}.png`,
    eps: `${base}/flags/eps/${code}.eps`,
  };
}

// ── Row shapes from DB ───────────────────────────────────────────────────────
interface FlagRow {
  code: string;
  name: string;
  slug: string | null;
}

// ── GET /api/v1/flags ────────────────────────────────────────────────────────
router.get('/flags', async (req: Request, res: Response): Promise<void> => {
  if (!checkIpRateLimit(req, res)) return;

  const region = typeof req.query['region'] === 'string' ? req.query['region'] : undefined;
  const limit = Math.min(Number(req.query['limit'] ?? 50), 250);
  const offset = Number(req.query['offset'] ?? 0);

  try {
    let query: string;
    let params: (string | number)[];

    if (region) {
      query = `
        SELECT c.code, c.name, c.slug
        FROM countries c
        WHERE LOWER(c.region) = LOWER($1)
        ORDER BY c.name
        LIMIT $2 OFFSET $3
      `;
      params = [region, limit, offset];
    } else {
      query = `
        SELECT c.code, c.name, c.slug
        FROM countries c
        ORDER BY c.name
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    }

    const result = await pool.query<FlagRow>(query, params);
    const flags = result.rows.map((row) => ({
      code: row.code,
      name: row.name,
      slug: row.slug ?? row.name?.toLowerCase().replace(/\s+/g, '-'),
      formats: buildFormats(row.code),
      license: 'free',
    }));

    res.json({ flags, count: flags.length, limit, offset });
  } catch (err) {
    console.error('[api-v1] GET /flags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/v1/flags/search ─────────────────────────────────────────────────
router.get('/flags/search', async (req: Request, res: Response): Promise<void> => {
  if (!checkIpRateLimit(req, res)) return;

  const q = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';
  if (!q) {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  try {
    const result = await pool.query<FlagRow>(
      `SELECT c.code, c.name, c.slug
       FROM countries c
       WHERE c.name ILIKE $1 OR c.code ILIKE $1
       ORDER BY c.name
       LIMIT 30`,
      [`%${q}%`]
    );
    const flags = result.rows.map((row) => ({
      code: row.code,
      name: row.name,
      slug: row.slug ?? row.name?.toLowerCase().replace(/\s+/g, '-'),
      formats: buildFormats(row.code),
      license: 'free',
    }));
    res.json({ flags, count: flags.length, query: q });
  } catch (err) {
    console.error('[api-v1] GET /flags/search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/v1/flags/:code ──────────────────────────────────────────────────
router.get('/flags/:code', async (req: Request, res: Response): Promise<void> => {
  if (!checkIpRateLimit(req, res)) return;

  const code = req.params['code']?.toLowerCase().trim();
  if (!code || !/^[a-z]{2,3}$/.test(code)) {
    res.status(400).json({ error: 'Invalid country code. Use ISO 3166-1 alpha-2 (e.g. "uz").' });
    return;
  }

  try {
    const result = await pool.query<FlagRow>(
      `SELECT c.code, c.name, c.slug
       FROM countries c
       WHERE LOWER(c.code) = $1
       LIMIT 1`,
      [code]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: `Flag not found for code: ${code}` });
      return;
    }

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: `Flag not found for code: ${code}` });
      return;
    }

    const formatFilter = typeof req.query['format'] === 'string' ? req.query['format'] : null;
    const allFormats = buildFormats(row.code);
    const formats =
      formatFilter && formatFilter in allFormats
        ? { [formatFilter]: allFormats[formatFilter as keyof typeof allFormats] }
        : allFormats;

    res.json({
      code: row.code,
      name: row.name,
      slug: row.slug ?? row.name?.toLowerCase().replace(/\s+/g, '-'),
      formats,
      license: 'free',
      premium_shapes: ['sphere', 'heart', 'star', 'wave'],
    });
  } catch (err) {
    console.error('[api-v1] GET /flags/:code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── API key row shape ────────────────────────────────────────────────────────
interface ApiKeyRow {
  id: number;
  clerk_user_id: string;
  key_prefix: string;
  plan: string;
  requests_today: number;
  requests_total: number;
  last_reset_at: Date;
  created_at: Date;
}

// ── GET /api/v1/me/api-key ───────────────────────────────────────────────────
router.get('/me/api-key', async (req: Request, res: Response): Promise<void> => {
  const clerkUserId = await clerkUserIdFromBearer(req);
  if (!clerkUserId) {
    res.status(401).json({ error: 'Authentication required. Provide a valid Clerk bearer token.' });
    return;
  }

  try {
    const result = await pool.query<ApiKeyRow>(
      `SELECT id, clerk_user_id, key_prefix, plan,
              requests_today, requests_total, last_reset_at, created_at
       FROM api_keys
       WHERE clerk_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [clerkUserId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No API key found for this user.' });
      return;
    }

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'No API key found for this user.' });
      return;
    }

    // Reset daily counter if last reset was yesterday or earlier
    const now = new Date();
    const lastReset = new Date(row.last_reset_at);
    const sameDay =
      now.getUTCFullYear() === lastReset.getUTCFullYear() &&
      now.getUTCMonth() === lastReset.getUTCMonth() &&
      now.getUTCDate() === lastReset.getUTCDate();

    let requestsToday = row.requests_today;
    if (!sameDay) {
      await pool.query(
        `UPDATE api_keys SET requests_today = 0, last_reset_at = NOW()
         WHERE id = $1`,
        [row.id]
      );
      requestsToday = 0;
    }

    const plan = row.plan ?? 'free';
    const dailyLimit = API_KEY_DAILY_LIMITS[plan] ?? 100;

    res.json({
      key_prefix: row.key_prefix,
      key_masked: `${row.key_prefix}****${row.key_prefix.slice(-4)}`,
      plan,
      requests_today: requestsToday,
      requests_total: row.requests_total,
      daily_limit: isFinite(dailyLimit) ? dailyLimit : 999999999,
      created_at: row.created_at,
    });
  } catch (err) {
    console.error('[api-v1] GET /me/api-key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/v1/me/api-key/generate ────────────────────────────────────────
router.post('/me/api-key/generate', async (req: Request, res: Response): Promise<void> => {
  const clerkUserId = await clerkUserIdFromBearer(req);
  if (!clerkUserId) {
    res.status(401).json({ error: 'Authentication required. Provide a valid Clerk bearer token.' });
    return;
  }

  try {
    // Generate a cryptographically secure random key
    const rawKey = `fs_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12); // "fs_live_xxxx"

    // Delete existing key for this user, then insert fresh (avoids ON CONFLICT ambiguity)
    await pool.query(`DELETE FROM api_keys WHERE clerk_user_id = $1`, [clerkUserId]);
    await pool.query(
      `INSERT INTO api_keys (clerk_user_id, key_hash, key_prefix, plan, requests_today, requests_total, last_reset_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'free', 0, 0, NOW(), NOW(), NOW())`,
      [clerkUserId, keyHash, keyPrefix]
    );

    // Return the raw key ONCE — not stored in plain text
    res.status(201).json({ key: rawKey });
  } catch (err) {
    console.error('[api-v1] POST /me/api-key/generate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
