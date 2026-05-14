/**
 * Upload routes — admin-only chunked + direct file ingestion.
 *
 * Pipeline:
 *   1. POST /initiate              start a session, get upload_id + chunk_size
 *   2. PUT  /:upload_id/chunk/:n   upload chunk N (0-indexed)
 *   3. POST /:upload_id/complete   finalize; pipeline runs async via Bull
 *   4. GET  /:upload_id/status     poll progress
 *   5. DEL  /:upload_id            cancel + cleanup
 *
 * Plus:
 *   POST /direct          single-shot multipart upload for small files
 *   POST /admin/cleanup   purge expired sessions/temp files
 *   POST /flag            legacy base64 → Vercel Blob (kept for backwards compat)
 *
 * All endpoints require an admin user (mounted under /api/admin/upload, but we
 * enforce locally so the router can also be reused under a different prefix).
 */

import express, { type Request, type Response, type Router } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import pool from '../db.js';
import {
  authenticateToken,
  requireAdmin,
  type AuthRequest,
} from '../auth/auth.middleware.js';
import {
  initiateUpload,
  uploadChunk,
  completeChunkedUpload,
  directUpload,
  getUploadStatus,
  cleanupExpiredUploads,
} from './upload.service.js';

// ---------------------------------------------------------------------------
// Multer (memory storage for chunks + direct uploads)
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '524288000', 10); // 500MB
const MAX_CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '10485760', 10); // 10MB

const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_CHUNK_SIZE + 1024 * 1024, // chunk + 1MB headroom for metadata
    files: 1,
  },
});

const directFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reject filenames containing path separators / NUL bytes / etc. */
function sanitizeFileName(name: string): string {
  if (typeof name !== 'string' || !name.length) {
    throw new Error('file_name is required');
  }
  if (name.length > 255) {
    throw new Error('file_name too long (max 255 chars)');
  }
  if (
    name.includes('/') ||
    name.includes('\\') ||
    name.includes('\0') ||
    name === '.' ||
    name === '..'
  ) {
    throw new Error('file_name contains invalid characters');
  }
  return name;
}

/** Hex upload_id only — 32 chars of [0-9a-f] from randomBytes(16). */
function isValidUploadId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{32}$/.test(id);
}

function paramAsString(v: unknown): string {
  return Array.isArray(v) ? String(v[0]) : String(v);
}

function asInt(v: unknown, fallback?: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) return n;
  }
  if (fallback !== undefined) return fallback;
  return NaN;
}

function sendError(res: Response, err: any, fallbackStatus = 500): void {
  const status = typeof err?.status === 'number' ? err.status : fallbackStatus;
  const message = err?.message || 'Upload error';
  if (status >= 500) {
    console.error('[upload] route error:', err);
  }
  res.status(status).json({ error: message });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router: Router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * POST /initiate
 * body: { file_name, file_size, mime_type, metadata? }
 * → { upload_id, chunk_size, total_chunks, expires_at }
 */
router.post('/initiate', async (req: AuthRequest, res: Response) => {
  try {
    const { file_name, file_size, mime_type, metadata } = req.body || {};

    const name = sanitizeFileName(file_name);
    const size = asInt(file_size);
    if (!Number.isFinite(size) || size <= 0) {
      return res.status(400).json({ error: 'file_size must be a positive integer' });
    }
    if (size > MAX_FILE_SIZE) {
      return res.status(413).json({
        error: `File size ${size} exceeds max ${MAX_FILE_SIZE}`,
      });
    }
    if (typeof mime_type !== 'string' || !mime_type.length) {
      return res.status(400).json({ error: 'mime_type is required' });
    }

    const session = await initiateUpload({
      file_name: name,
      file_size: size,
      mime_type,
      metadata: {
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
        admin_id: req.user!.userId,
      },
    });

    return res.status(201).json({
      upload_id: session.upload_id,
      chunk_size: session.chunk_size,
      total_chunks: Math.ceil(size / session.chunk_size),
      expires_at: session.expires_at,
    });
  } catch (err) {
    return sendError(res, err, 400);
  }
});

/**
 * PUT /:upload_id/chunk/:chunk_number
 *   - body: multipart with field `chunk` (a single file part), OR
 *   - body: application/octet-stream raw bytes.
 * → { chunk_received, chunks_complete, chunks_total }
 */
router.put(
  '/:upload_id/chunk/:chunk_number',
  // accept either multipart OR raw octet-stream
  (req: Request, res: Response, next) => {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.startsWith('multipart/')) {
      return chunkUpload.single('chunk')(req, res, next);
    }
    return express.raw({ type: '*/*', limit: MAX_CHUNK_SIZE + 1024 * 1024 })(
      req,
      res,
      next
    );
  },
  async (req: AuthRequest, res: Response) => {
    try {
      const upload_id = paramAsString(req.params.upload_id);
      if (!isValidUploadId(upload_id)) {
        return res.status(400).json({ error: 'Invalid upload_id format' });
      }

      const chunkNumber = asInt(paramAsString(req.params.chunk_number));
      if (!Number.isFinite(chunkNumber) || chunkNumber < 0) {
        return res.status(400).json({ error: 'Invalid chunk_number' });
      }

      let chunkBuffer: Buffer | undefined;
      if ((req as any).file?.buffer) {
        chunkBuffer = (req as any).file.buffer as Buffer;
      } else if (Buffer.isBuffer(req.body)) {
        chunkBuffer = req.body;
      }

      if (!chunkBuffer || chunkBuffer.length === 0) {
        return res.status(400).json({
          error: 'No chunk data received. Send multipart field "chunk" or raw octet-stream body.',
        });
      }

      const result = await uploadChunk(upload_id, chunkNumber, chunkBuffer);
      return res.json(result);
    } catch (err: any) {
      // Service uses meaningful messages — surface them to the caller.
      if (
        err?.message === 'Upload session not found' ||
        err?.message?.startsWith?.('Invalid chunk number')
      ) {
        return sendError(res, err, 404);
      }
      return sendError(res, err, 400);
    }
  }
);

/**
 * POST /:upload_id/complete
 * body: { checksum?: "sha256:..." }
 * → { file_id, processing_job_id, status }
 */
router.post('/:upload_id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const upload_id = paramAsString(req.params.upload_id);
    if (!isValidUploadId(upload_id)) {
      return res.status(400).json({ error: 'Invalid upload_id format' });
    }

    const checksum =
      typeof req.body?.checksum === 'string' ? req.body.checksum : undefined;

    const result = await completeChunkedUpload(upload_id, checksum);
    return res.status(202).json(result);
  } catch (err: any) {
    if (err?.message === 'Upload session not found') {
      return sendError(res, err, 404);
    }
    if (
      err?.message === 'Checksum mismatch' ||
      err?.message?.startsWith?.('Not all chunks received')
    ) {
      return sendError(res, err, 409);
    }
    return sendError(res, err, 400);
  }
});

/**
 * GET /:upload_id/status
 * → upload + processing job status as recorded in DB.
 */
router.get('/:upload_id/status', async (req: AuthRequest, res: Response) => {
  try {
    const upload_id = paramAsString(req.params.upload_id);
    if (!isValidUploadId(upload_id)) {
      return res.status(400).json({ error: 'Invalid upload_id format' });
    }
    const status = await getUploadStatus(upload_id);
    return res.json(status);
  } catch (err: any) {
    if (err?.message === 'Upload not found') {
      return sendError(res, err, 404);
    }
    return sendError(res, err, 400);
  }
});

/**
 * DELETE /:upload_id
 * Cancel an in-flight upload session, free temp disk + DB row.
 */
router.delete('/:upload_id', async (req: AuthRequest, res: Response) => {
  try {
    const upload_id = paramAsString(req.params.upload_id);
    if (!isValidUploadId(upload_id)) {
      return res.status(400).json({ error: 'Invalid upload_id format' });
    }

    // Best-effort: remove DB row + temp dir. Re-use cleanup helper by faking expiry.
    await pool.query(
      `UPDATE upload_temp_files
          SET status = 'failed',
              processing_error = 'cancelled by admin',
              expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second'
        WHERE upload_id = $1`,
      [upload_id]
    );
    await cleanupExpiredUploads();
    return res.json({ ok: true });
  } catch (err) {
    return sendError(res, err);
  }
});

/**
 * POST /direct
 * One-shot multipart upload — for small files where chunking is overkill.
 * Body: multipart, field name `file`. Other form fields become metadata.
 */
router.post('/direct', directFileUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.buffer) {
      return res.status(400).json({ error: 'No file received (multipart field "file")' });
    }

    const name = sanitizeFileName(file.originalname);
    // Anything outside the `file` part is treated as JSON-ish metadata.
    const metadata: Record<string, any> = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (k === 'file') continue;
      metadata[k] = v;
    }
    metadata.admin_id = req.user!.userId;

    const result = await directUpload(file.buffer, name, file.mimetype, metadata);
    return res.status(202).json(result);
  } catch (err) {
    return sendError(res, err, 400);
  }
});

/**
 * POST /admin/cleanup
 * Run an immediate cleanup pass on expired sessions and orphaned temp files.
 * Returns the number of records removed.
 */
router.post('/admin/cleanup', async (_req: AuthRequest, res: Response) => {
  try {
    const removed = await cleanupExpiredUploads();
    return res.json({ removed });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Legacy: POST /flag — base64 → Vercel Blob (kept so existing callers keep
// working until they migrate to the chunked pipeline).
// ---------------------------------------------------------------------------

router.post('/flag', async (req: Request, res: Response) => {
  try {
    const { name, country, file } = req.body || {};
    if (typeof name !== 'string' || typeof file !== 'string') {
      return res.status(400).json({ error: 'name and base64-encoded file are required' });
    }

    const buffer = Buffer.from(file, 'base64');
    const blob = await put(`flags/${sanitizeFileName(name)}.svg`, buffer, {
      access: 'public',
    });

    await pool.query(
      'INSERT INTO flags (name, country, file_url) VALUES ($1, $2, $3)',
      [name, country || null, blob.url]
    );

    res.json({ success: true, url: blob.url });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
