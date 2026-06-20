/**
 * Canonical short path: POST /api/admin/import-r2 (Clerk bearer, same logic as POST …/flag-files/import-r2).
 */

import express, { type Response } from 'express';
import pool from '../db.js';
import { verifyClerkAdminBearer } from '../auth/clerk-admin.server.js';
import { requireR2Config } from '../storage/r2.js';
import { runR2Import } from '../scripts/import-r2-files.js';

const router = express.Router();

router.post('/', async (req: express.Request, res: Response) => {
  const gate = await verifyClerkAdminBearer(req.headers.authorization);
  if (!gate.ok) {
    return res.status(gate.status).json({ error: gate.error, code: gate.code });
  }

  try {
    requireR2Config();
  } catch {
    return res.status(503).json({
      error: 'R2 storage is not configured on the API server.',
      code: 'r2_config',
    });
  }

  const rawMax = req.query.maxObjects ?? req.query.max;
  let maxObjects = 100_000;
  if (rawMax !== undefined) {
    const raw = Array.isArray(rawMax) ? rawMax[0] : rawMax;
    const n = Number(raw);
    if (Number.isFinite(n)) {
      maxObjects = Math.min(100_000, Math.max(1, Math.floor(n)));
    }
  }

  const rawPrefix = req.query.prefix;
  const prefix =
    typeof rawPrefix === 'string'
      ? rawPrefix.trim()
      : Array.isArray(rawPrefix) && typeof rawPrefix[0] === 'string'
        ? rawPrefix[0].trim()
        : '';

  try {
    const stats = await runR2Import({
      maxObjects,
      prefix: prefix || undefined,
      pool,
    });
    return res.json({
      ok: true,
      scanned: stats.scanned,
      imported: stats.inserted,
      inserted: stats.inserted,
      updated: stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
    });
  } catch (err: unknown) {
    console.error('[admin-import-r2]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Import failed',
      code: 'import_failed',
    });
  }
});

export default router;
