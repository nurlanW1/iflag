// Asset Processing Queue Service
// Handles async processing of assets (previews, watermarks, conversions, etc.)

import pool from '../db.js';

export type ProcessingJobType = 
  | 'preview' 
  | 'watermark' 
  | 'convert' 
  | 'optimize' 
  | 'resize' 
  | 'thumbnail'
  | 'video_preview';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingJob {
  id: string;
  asset_id: string;
  asset_file_id: string | null;
  job_type: ProcessingJobType;
  status: ProcessingStatus;
  priority: number;
  parameters: Record<string, any>;
  progress_percent: number;
  error_message: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  retry_count: number;
  max_retries: number;
}

export interface CreateJobParams {
  asset_id: string;
  asset_file_id?: string;
  job_type: ProcessingJobType;
  priority?: number;
  parameters?: Record<string, any>;
}

// Create processing job
export async function createProcessingJob(params: CreateJobParams): Promise<ProcessingJob> {
  const { asset_id, asset_file_id, job_type, priority = 5, parameters = {} } = params;
  
  const result = await pool.query(
    `INSERT INTO asset_processing_queue (
       asset_id, asset_file_id, job_type, priority, parameters
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [asset_id, asset_file_id || null, job_type, priority, JSON.stringify(parameters)]
  );
  
  return result.rows[0];
}

// Get next job to process
export async function getNextJob(): Promise<ProcessingJob | null> {
  const result = await pool.query(
    `SELECT * FROM asset_processing_queue
     WHERE status = 'pending'
     ORDER BY priority ASC, created_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`,
    []
  );
  
  return result.rows[0] || null;
}

// Update job status
export async function updateJobStatus(
  job_id: string,
  status: ProcessingStatus,
  progress?: number,
  error_message?: string
): Promise<void> {
  const updates: string[] = ['status = $2'];
  const params: any[] = [job_id, status];
  let paramCount = 2;
  
  if (status === 'processing' && !progress) {
    paramCount++;
    updates.push(`started_at = COALESCE(started_at, CURRENT_TIMESTAMP)`);
  }
  
  if (progress !== undefined) {
    paramCount++;
    updates.push(`progress_percent = $${paramCount}`);
    params.push(progress);
  }
  
  if (error_message !== undefined) {
    paramCount++;
    updates.push(`error_message = $${paramCount}`);
    params.push(error_message);
  }
  
  if (status === 'completed' || status === 'failed') {
    paramCount++;
    updates.push(`completed_at = CURRENT_TIMESTAMP`);
  }
  
  await pool.query(
    `UPDATE asset_processing_queue SET ${updates.join(', ')} WHERE id = $1`,
    params
  );
}

// Retry failed job
export async function retryJob(job_id: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE asset_processing_queue
     SET status = 'pending',
         retry_count = retry_count + 1,
         error_message = NULL,
         started_at = NULL,
         completed_at = NULL
     WHERE id = $1 AND retry_count < max_retries
     RETURNING id`,
    [job_id]
  );
  
  return result.rows.length > 0;
}

// Get jobs for asset
export async function getAssetJobs(asset_id: string): Promise<ProcessingJob[]> {
  const result = await pool.query(
    `SELECT * FROM asset_processing_queue
     WHERE asset_id = $1
     ORDER BY created_at DESC`,
    [asset_id]
  );
  
  return result.rows;
}

// Get job by ID
export async function getJob(job_id: string): Promise<ProcessingJob | null> {
  const result = await pool.query(
    'SELECT * FROM asset_processing_queue WHERE id = $1',
    [job_id]
  );
  
  return result.rows[0] || null;
}

// Clean up old completed jobs (older than 30 days)
export async function cleanupOldJobs(days: number = 30): Promise<number> {
  const result = await pool.query(
    `DELETE FROM asset_processing_queue
     WHERE status IN ('completed', 'failed')
     AND completed_at < CURRENT_TIMESTAMP - INTERVAL '${days} days'
     RETURNING id`
  );
  
  return result.rows.length;
}
