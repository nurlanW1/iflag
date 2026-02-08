// Upload Service - Handles file uploads and initiates processing pipeline

import { randomBytes, createHash } from 'crypto';
import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pool from '../db.js';
import { createStorageProvider, generateUniqueFilename, getAssetFolder } from 'storage';
import { detectFormatFromFilename, FORMAT_METADATA } from 'asset-types';
import { createProcessingJob } from '../assets/processing-queue.service.js';

const UPLOAD_TEMP_DIR = process.env.UPLOAD_TEMP_DIR || './tmp/uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '524288000'); // 500MB
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '10485760'); // 10MB

export interface UploadSession {
  upload_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  total_chunks: number;
  chunks_received: number;
  chunks_data: Map<number, Buffer>;
  temp_path: string;
  metadata: Record<string, any>;
  created_at: Date;
  expires_at: Date;
}

export interface UploadResult {
  file_id: string;
  processing_job_id: string;
  status: 'processing' | 'completed' | 'failed';
  file_url?: string;
}

// In-memory storage for upload sessions (use Redis in production)
const uploadSessions = new Map<string, UploadSession>();

// Initialize upload session
export async function initiateUpload(data: {
  file_name: string;
  file_size: number;
  mime_type: string;
  metadata?: Record<string, any>;
}): Promise<{ upload_id: string; chunk_size: number; expires_at: Date }> {
  const { file_name, file_size, mime_type, metadata = {} } = data;

  // Validate file size
  if (file_size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE} bytes`);
  }

  // Validate format
  const format = detectFormatFromFilename(file_name);
  if (!format) {
    throw new Error(`Unsupported file format: ${file_name}`);
  }

  const upload_id = randomBytes(16).toString('hex');
  const total_chunks = Math.ceil(file_size / CHUNK_SIZE);
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const session: UploadSession = {
    upload_id,
    file_name,
    file_size,
    mime_type,
    total_chunks,
    chunks_received: 0,
    chunks_data: new Map(),
    temp_path: join(UPLOAD_TEMP_DIR, upload_id),
    metadata,
    created_at: new Date(),
    expires_at,
  };

  // Create temp directory
  if (!existsSync(UPLOAD_TEMP_DIR)) {
    await mkdir(UPLOAD_TEMP_DIR, { recursive: true });
  }
  await mkdir(session.temp_path, { recursive: true });

  uploadSessions.set(upload_id, session);

  return {
    upload_id,
    chunk_size: CHUNK_SIZE,
    expires_at,
  };
}

// Upload chunk
export async function uploadChunk(
  upload_id: string,
  chunk_number: number,
  chunk_data: Buffer
): Promise<{ chunk_received: boolean; chunks_complete: number; chunks_total: number }> {
  const session = uploadSessions.get(upload_id);
  if (!session) {
    throw new Error('Upload session not found');
  }

  if (session.chunks_received >= session.total_chunks) {
    throw new Error('All chunks already received');
  }

  // Validate chunk number
  if (chunk_number < 0 || chunk_number >= session.total_chunks) {
    throw new Error(`Invalid chunk number: ${chunk_number}`);
  }

  // Store chunk
  session.chunks_data.set(chunk_number, chunk_data);
  session.chunks_received++;

  // Save chunk to disk (for large files)
  const chunk_path = join(session.temp_path, `chunk_${chunk_number}`);
  await writeFile(chunk_path, chunk_data);

  return {
    chunk_received: true,
    chunks_complete: session.chunks_received,
    chunks_total: session.total_chunks,
  };
}

// Complete chunked upload
export async function completeChunkedUpload(
  upload_id: string,
  expected_checksum?: string
): Promise<UploadResult> {
  const session = uploadSessions.get(upload_id);
  if (!session) {
    throw new Error('Upload session not found');
  }

  if (session.chunks_received !== session.total_chunks) {
    throw new Error(`Not all chunks received: ${session.chunks_received}/${session.total_chunks}`);
  }

  // Reassemble file from chunks
  const chunks: Buffer[] = [];
  for (let i = 0; i < session.total_chunks; i++) {
    const chunk_path = join(session.temp_path, `chunk_${i}`);
    const chunk_data = await readFile(chunk_path);
    chunks.push(chunk_data);
  }

  const file_buffer = Buffer.concat(chunks);

  // Verify checksum if provided
  if (expected_checksum) {
    const actual_checksum = createHash('sha256').update(file_buffer).digest('hex');
    if (actual_checksum !== expected_checksum.replace('sha256:', '')) {
      throw new Error('Checksum mismatch');
    }
  }

  // Process upload
  return await processUpload(file_buffer, session);
}

// Direct upload (for smaller files)
export async function directUpload(
  file_buffer: Buffer,
  file_name: string,
  mime_type: string,
  metadata: Record<string, any> = {}
): Promise<UploadResult> {
  // Validate file size
  if (file_buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE} bytes`);
  }

  // Validate format
  const format = detectFormatFromFilename(file_name);
  if (!format) {
    throw new Error(`Unsupported file format: ${file_name}`);
  }

  return await processUpload(file_buffer, {
    upload_id: randomBytes(16).toString('hex'),
    file_name,
    file_size: file_buffer.length,
    mime_type,
    total_chunks: 1,
    chunks_received: 1,
    chunks_data: new Map(),
    temp_path: '',
    metadata,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

// Process upload (common logic)
async function processUpload(
  file_buffer: Buffer,
  session: UploadSession
): Promise<UploadResult> {
  const format = detectFormatFromFilename(session.file_name);
  if (!format) {
    throw new Error('Invalid file format');
  }

  // Start database transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create temporary file record
    const temp_file_result = await client.query(
      `INSERT INTO upload_temp_files (
         upload_id, file_name, file_size, mime_type, format_code,
         temp_path, metadata, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploaded')
       RETURNING id`,
      [
        session.upload_id,
        session.file_name,
        session.file_size,
        session.mime_type,
        format,
        session.temp_path,
        JSON.stringify(session.metadata),
      ]
    );

    const temp_file_id = temp_file_result.rows[0].id;

    // Save file to temporary storage
    const temp_filename = `${session.upload_id}_${session.file_name}`;
    const temp_file_path = join(UPLOAD_TEMP_DIR, session.upload_id, temp_filename);
    await writeFile(temp_file_path, file_buffer);

    // Calculate checksum
    const checksum = createHash('sha256').update(file_buffer).digest('hex');

    // Update temp file record with checksum
    await client.query(
      'UPDATE upload_temp_files SET checksum = $1 WHERE id = $2',
      [checksum, temp_file_id]
    );

    // Create processing job in queue
    const { uploadQueue } = await import('./job-processor.js');
    const job = await uploadQueue.add('file-upload', {
      temp_file_id,
      upload_id: session.upload_id,
      file_name: session.file_name,
      file_size: session.file_size,
      mime_type: session.mime_type,
      format,
      temp_file_path,
      checksum,
      metadata: session.metadata,
    }, {
      priority: 1, // High priority
      jobId: temp_file_id, // Use temp_file_id as job ID
    });

    const job_id = job.id.toString();

    await client.query('COMMIT');

    // Cleanup session
    uploadSessions.delete(session.upload_id);

    return {
      file_id: temp_file_id,
      processing_job_id: job_id,
      status: 'processing',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Cleanup on error
    await cleanupUpload(session.upload_id);
    
    throw error;
  } finally {
    client.release();
  }
}

// Cleanup upload (rollback)
async function cleanupUpload(upload_id: string): Promise<void> {
  const session = uploadSessions.get(upload_id);
  if (!session) return;

  try {
    // Delete temp directory
    if (existsSync(session.temp_path)) {
      const { rm } = await import('fs/promises');
      await rm(session.temp_path, { recursive: true, force: true });
    }

    // Delete database records
    await pool.query('DELETE FROM upload_temp_files WHERE upload_id = $1', [upload_id]);

    // Remove session
    uploadSessions.delete(upload_id);
  } catch (error) {
    console.error('Cleanup error:', error);
    // Continue even if cleanup fails
  }
}

// Get upload status
export async function getUploadStatus(upload_id: string): Promise<any> {
  const result = await pool.query(
    `SELECT 
       utf.id,
       utf.status,
       utf.processing_error,
       pj.status as job_status,
       pj.progress_percent,
       pj.error_message
     FROM upload_temp_files utf
     LEFT JOIN asset_processing_queue pj ON utf.id = pj.asset_file_id
     WHERE utf.upload_id = $1`,
    [upload_id]
  );

  if (result.rows.length === 0) {
    throw new Error('Upload not found');
  }

  return result.rows[0];
}

// Cleanup expired uploads (cron job)
export async function cleanupExpiredUploads(): Promise<number> {
  const expired = Array.from(uploadSessions.values()).filter(
    (session) => session.expires_at < new Date()
  );

  for (const session of expired) {
    await cleanupUpload(session.upload_id);
  }

  // Also cleanup database records
  const result = await pool.query(
    `DELETE FROM upload_temp_files 
     WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
     AND status != 'completed'
     RETURNING id`
  );

  return expired.length + result.rows.length;
}
