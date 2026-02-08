// Upload Routes - Admin file upload endpoints

import express from 'express';
import multer from 'multer';
import {
  initiateUpload,
  uploadChunk,
  completeChunkedUpload,
  directUpload,
  getUploadStatus,
} from './upload.service.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth/auth.middleware.js';

const router = express.Router();

// All upload routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Configure multer for direct uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for direct uploads
  },
});

// POST /api/admin/upload/initiate - Initialize chunked upload
router.post('/initiate', async (req: AuthRequest, res) => {
  try {
    const { file_name, file_size, mime_type, metadata } = req.body;

    if (!file_name || !file_size || !mime_type) {
      return res.status(400).json({ error: 'file_name, file_size, and mime_type are required' });
    }

    const result = await initiateUpload({
      file_name,
      file_size: parseInt(file_size),
      mime_type,
      metadata: metadata || {},
    });

    res.json(result);
  } catch (error: any) {
    console.error('Initiate upload error:', error);
    res.status(400).json({ error: error.message || 'Failed to initiate upload' });
  }
});

// POST /api/admin/upload/chunk - Upload file chunk
router.post('/chunk', async (req: AuthRequest, res) => {
  try {
    const { upload_id, chunk_number } = req.body;
    const chunk_data = req.file?.buffer;

    if (!upload_id || chunk_number === undefined || !chunk_data) {
      return res.status(400).json({ error: 'upload_id, chunk_number, and chunk_data are required' });
    }

    const result = await uploadChunk(upload_id, parseInt(chunk_number), chunk_data);
    res.json(result);
  } catch (error: any) {
    console.error('Upload chunk error:', error);
    res.status(400).json({ error: error.message || 'Failed to upload chunk' });
  }
});

// POST /api/admin/upload/complete - Complete chunked upload
router.post('/complete', async (req: AuthRequest, res) => {
  try {
    const { upload_id, checksum } = req.body;

    if (!upload_id) {
      return res.status(400).json({ error: 'upload_id is required' });
    }

    const result = await completeChunkedUpload(upload_id, checksum);
    res.json(result);
  } catch (error: any) {
    console.error('Complete upload error:', error);
    res.status(400).json({ error: error.message || 'Failed to complete upload' });
  }
});

// POST /api/admin/upload/direct - Direct upload (small files)
router.post('/direct', upload.array('files', 20), async (req: AuthRequest, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

    const uploads = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await directUpload(
            file.buffer,
            file.originalname,
            file.mimetype,
            metadata
          );
          return {
            file_name: file.originalname,
            ...result,
          };
        } catch (error: any) {
          return {
            file_name: file.originalname,
            status: 'failed',
            error: error.message,
          };
        }
      })
    );

    res.json({ uploads });
  } catch (error: any) {
    console.error('Direct upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload files' });
  }
});

// GET /api/admin/upload/status/:upload_id - Get upload status
router.get('/status/:upload_id', async (req: AuthRequest, res) => {
  try {
    const uploadId = Array.isArray(req.params.upload_id) ? req.params.upload_id[0] : req.params.upload_id;
    const status = await getUploadStatus(uploadId);
    res.json(status);
  } catch (error: any) {
    console.error('Get upload status error:', error);
    res.status(404).json({ error: error.message || 'Upload not found' });
  }
});

export default router;
