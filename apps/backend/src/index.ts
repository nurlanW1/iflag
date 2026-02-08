import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import flagsRouter from './flags.routes.js';
import authRouter from './auth/auth.routes.js';
import subscriptionRouter from './subscriptions/subscription.routes.js';
import assetRouter from './assets/asset.routes.js';
import adminRouter from './admin/admin.routes.js';
import uploadRouter from './upload/upload.routes.js';
import pool from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API routes
app.get('/', (req, res) => {
  res.json({
    name: 'Flag Stock Marketplace API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      assets: '/api/assets',
      subscriptions: '/api/subscriptions',
      flags: '/api/flags', // Legacy endpoint
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionRouter);
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

// Start server
app.listen(port, () => {
  console.log(`🚀 Flag Stock Marketplace Backend API listening on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
