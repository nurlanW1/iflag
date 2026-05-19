import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmetPackage from "helmet";
import compression from 'compression';
import rateLimitPackage from "express-rate-limit";
import flagsRouter from './flags.routes.js';
import authRouter from './auth/auth.routes.js';
import subscriptionRouter from './subscriptions/subscription.routes.js';
import assetRouter from './assets/asset.routes.js';
import adminRouter from './admin/admin.routes.js';
import uploadRouter from './upload/upload.routes.js';
import billingRouter, { paddleWebhookHandler } from './billing/billing.routes.js';
import flagFilesUploadRouter from './admin/flag-files-upload.routes.js';
import pool from './db.js';

/** Unwrap default interop; type `any` avoids TS merging with `typeof import(...)` (non-callable under NodeNext). */
const helmet: any = (helmetPackage as any).default || helmetPackage;
const rateLimit: any = (rateLimitPackage as any).default || rateLimitPackage;

const app = express();
/** Railway injects `PORT` (string); local dev defaults to 4000 (number). */
const port = process.env.PORT || 4000;
const listenPort = Number(port) || 4000;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

function buildAllowedCorsOrigins(): Set<string> {
  const builtin = ['https://flagswing.com', 'https://www.flagswing.com', 'http://localhost:3000'];
  const fromFrontend = (process.env.FRONTEND_URL || '')
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const extra = (process.env.ADDITIONAL_CORS_ORIGINS || '')
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...builtin, ...fromFrontend, ...extra]);
}

const allowedCorsOrigins = buildAllowedCorsOrigins();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS — credentials for cookie/JWT cross-origin when frontend calls API directly (e.g. axios + NEXT_PUBLIC_API_URL)
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedCorsOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    if (process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true') {
      try {
        const { hostname } = new URL(origin);
        if (hostname.endsWith('.vercel.app')) {
          callback(null, true);
          return;
        }
      } catch {
        /* ignore malformed Origin */
      }
    }
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Clerk-admin multipart uploads → R2 (avoid generic /api rate limit on large bodies)
app.use('/api/admin/flag-files', flagFilesUploadRouter);

// Billing webhooks — MUST be mounted with raw body and BEFORE `express.json()`
// so HMAC signatures verify against the exact bytes the provider sent. Mounted
// BEFORE the rate limiter so provider retries are not 429-ed.
app.post(
  '/api/billing/webhook/paddle',
  express.raw({ type: '*/*', limit: '5mb' }),
  paddleWebhookHandler
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});
app.use('/api/auth/', authLimiter);

// Body parsing (general)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (Railway / load balancers)
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    console.error('[health] database check failed:', error);
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API routes
app.get('/', (req, res) => {
  res.json({
    name: 'Flag Stock Marketplace API',
    version: '1.1.0',
    endpoints: {
      auth: '/api/auth',
      assets: '/api/assets',
      subscriptions: '/api/subscriptions',
      billing: '/api/billing',
      billing_webhook_paddle: '/api/billing/webhook/paddle',
      admin: '/api/admin',
      admin_upload: '/api/admin/upload',
      flags: '/api/flags', // Legacy endpoint
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/billing', billingRouter); // Paddle Billing: checkout, portal, subscriptions, orders
app.use('/api/assets', assetRouter);
app.use('/api/admin', adminRouter); // Admin routes (requires admin role)
app.use('/api/admin/upload', uploadRouter); // Upload routes (requires admin role)
app.use('/api/flags', flagsRouter); // Legacy endpoint

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server — bind 0.0.0.0 for Railway/Docker
const listenHost = process.env.LISTEN_HOST || '0.0.0.0';

process.on('unhandledRejection', (reason, promise) => {
  console.error('[process] unhandledRejection at', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[process] uncaughtException:', err);
  process.exit(1);
});

try {
  const server = app.listen(listenPort, listenHost, () => {
    console.log(`[startup] Flag Stock Marketplace Backend API listening on ${listenHost}:${listenPort}`);
    console.log(`[startup] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
    if (!process.env.DATABASE_URL?.trim()) {
      console.warn('[startup] WARNING: DATABASE_URL is unset — /health will fail until configured.');
    }
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    console.error('[startup] Failed to bind HTTP server:', err.message, err.code ?? '');
    process.exit(1);
  });
} catch (err) {
  console.error('[startup] Fatal error while starting server:', err);
  process.exit(1);
}
