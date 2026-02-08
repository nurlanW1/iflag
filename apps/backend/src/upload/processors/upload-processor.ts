// Upload Processor - Handles the complete upload pipeline

import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import pool from '../../db.js';
import { createStorageProvider, generateUniqueFilename, getAssetFolder } from 'storage';
import { detectFormatFromFilename, FORMAT_METADATA } from 'asset-types';
import { createProcessingJob, updateJobStatus } from '../../assets/processing-queue.service.js';
import { validateFileFormat } from './validators/format-validator.js';
import { scanFile } from './scanners/virus-scanner.js';
import { extractMetadata } from './extractors/metadata-extractor.js';
import { generatePreviews } from './generators/preview-generator.js';

// Import types
interface ProcessingJob {
  id: string;
  parameters: any;
}

interface ProcessingContext {
  job_id: string;
  temp_file_id: string;
  upload_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  format: string;
  temp_file_path: string;
  checksum: string;
  metadata: Record<string, any>;
}

interface RollbackContext {
  files_created: string[];
  database_records: string[];
  cdn_urls: string[];
  cleanup_actions: Array<() => Promise<void>>;
}

// Main processing pipeline
export async function processUploadPipeline(job: ProcessingJob): Promise<void> {
  const context: ProcessingContext = job.parameters;
  const rollback: RollbackContext = {
    files_created: [],
    database_records: [],
    cdn_urls: [],
    cleanup_actions: [],
  };

  try {
    // Stage 1: Format Validation
    await updateJobStatus(job.id, 'processing', 10, undefined);
    await validateFormat(context, rollback);

    // Stage 2: Virus Scan
    await updateJobStatus(job.id, 'processing', 20, undefined);
    await scanForVirus(context, rollback);

    // Stage 3: Metadata Extraction
    await updateJobStatus(job.id, 'processing', 30, undefined);
    const extracted_metadata = await extractFileMetadata(context, rollback);

    // Stage 4: Preview Generation
    await updateJobStatus(job.id, 'processing', 50, undefined);
    const previews = await generateFilePreviews(context, extracted_metadata, rollback);

    // Stage 5: Storage Upload
    await updateJobStatus(job.id, 'processing', 70, undefined);
    const storage_urls = await uploadToStorage(context, previews, rollback);

    // Stage 6: CDN Cache Update
    await updateJobStatus(job.id, 'processing', 85, undefined);
    await purgeCDNCache(storage_urls, rollback);

    // Stage 7: Database Records & Finalization
    await updateJobStatus(job.id, 'processing', 90, undefined);
    await finalizeUpload(context, storage_urls, extracted_metadata, rollback);

    // Complete
    await updateJobStatus(job.id, 'completed', 100, undefined);

    // Cleanup temp files
    await cleanupTempFiles(context.temp_file_path);
  } catch (error: any) {
    console.error('Processing pipeline error:', error);
    
    // Rollback
    await rollbackUpload(rollback);
    
    // Update job status
    await updateJobStatus(job.id, 'failed', undefined, error.message);
    
    throw error;
  }
}

// Stage 1: Format Validation
async function validateFormat(context: ProcessingContext, rollback: RollbackContext): Promise<void> {
  const file_buffer = await readFile(context.temp_file_path);
  
  const validation_result = await validateFileFormat(
    file_buffer,
    context.mime_type,
    context.format
  );

  if (!validation_result.valid) {
    throw new Error(`Format validation failed: ${validation_result.error}`);
  }

  // Verify checksum
  const { createHash } = await import('crypto');
  const calculated_checksum = createHash('sha256').update(file_buffer).digest('hex');
  
  if (calculated_checksum !== context.checksum) {
    throw new Error('Checksum mismatch');
  }
}

// Stage 2: Virus Scan
async function scanForVirus(context: ProcessingContext, rollback: RollbackContext): Promise<void> {
  const scan_result = await scanFile(context.temp_file_path);

  if (!scan_result.clean) {
    // Quarantine file
    const quarantine_path = await quarantineFile(context.temp_file_path, context.file_name);
    rollback.cleanup_actions.push(async () => {
      if (existsSync(quarantine_path)) {
        await unlink(quarantine_path);
      }
    });

    // Notify admin
    await notifyAdmin('Virus detected', {
      file_name: context.file_name,
      upload_id: context.upload_id,
      viruses: scan_result.viruses,
    });

    throw new SecurityError('Virus detected in file', {
      viruses: scan_result.viruses,
      file: context.file_name,
    });
  }
}

// Stage 3: Metadata Extraction
async function extractFileMetadata(
  context: ProcessingContext,
  rollback: RollbackContext
): Promise<Record<string, any>> {
  const file_buffer = await readFile(context.temp_file_path);
  
  const metadata = await extractMetadata(file_buffer, context.format, context.mime_type);

  // Update temp file record with metadata
  await pool.query(
    'UPDATE upload_temp_files SET extracted_metadata = $1 WHERE id = $2',
    [JSON.stringify(metadata), context.temp_file_id]
  );

  return metadata;
}

// Stage 4: Preview Generation
async function generateFilePreviews(
  context: ProcessingContext,
  metadata: Record<string, any>,
  rollback: RollbackContext
): Promise<Array<{ type: string; buffer: Buffer; width?: number; height?: number }>> {
  const file_buffer = await readFile(context.temp_file_path);
  
  const previews = await generatePreviews(
    file_buffer,
    context.format,
    metadata
  );

  return previews;
}

// Stage 5: Storage Upload
async function uploadToStorage(
  context: ProcessingContext,
  previews: Array<{ type: string; buffer: Buffer; width?: number; height?: number }>,
  rollback: RollbackContext
): Promise<Record<string, string>> {
  const storage = createStorageProvider({
    type: process.env.STORAGE_TYPE === 's3' ? 's3' : 'local',
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:4000/uploads',
    basePath: process.env.STORAGE_BASE_PATH || './uploads',
  });

  const format_metadata = FORMAT_METADATA[context.format as keyof typeof FORMAT_METADATA];
  const folder = getAssetFolder(format_metadata.format_category);
  const asset_folder = `assets/${folder}/${context.upload_id}`;

  const urls: Record<string, string> = {};

  // Upload original file
  const original_filename = generateUniqueFilename(context.file_name);
  const original_path = `${asset_folder}/original/${original_filename}`;
  const file_buffer = await readFile(context.temp_file_path);
  
  const original_url = await storage.upload(file_buffer, original_filename, `${asset_folder}/original`);
  urls.original = original_url;
  rollback.files_created.push(original_path);
  rollback.cdn_urls.push(original_url);

  // Upload previews
  for (const preview of previews) {
    const preview_filename = generateUniqueFilename(`${preview.type}_${context.file_name}`);
    const preview_path = `${asset_folder}/preview/${preview_filename}`;
    
    const preview_url = await storage.upload(
      preview.buffer,
      preview_filename,
      `${asset_folder}/preview`
    );
    
    urls[preview.type] = preview_url;
    rollback.files_created.push(preview_path);
    rollback.cdn_urls.push(preview_url);
  }

  return urls;
}

// Stage 6: CDN Cache Purge
async function purgeCDNCache(urls: Record<string, string>, rollback: RollbackContext): Promise<void> {
  const cdn_provider = process.env.CDN_PROVIDER || 'cloudflare';
  
  if (cdn_provider === 'cloudflare') {
    const { purgeCloudflareCache } = await import('./cdn/cloudflare.js');
    await purgeCloudflareCache(Object.values(urls));
  } else if (cdn_provider === 'cloudfront') {
    const { purgeCloudFrontCache } = await import('./cdn/cloudfront.js');
    await purgeCloudFrontCache(Object.values(urls));
  }
  // If no CDN, skip
}

// Stage 7: Finalization
async function finalizeUpload(
  context: ProcessingContext,
  urls: Record<string, string>,
  metadata: Record<string, any>,
  rollback: RollbackContext
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create or update flag (if flag_id in metadata)
    let flag_id = context.metadata.flag_id;
    
    if (!flag_id && context.metadata.flag_title) {
      // Create new flag
      const flag_result = await client.query(
        `INSERT INTO flags (title, slug, status, created_by)
         VALUES ($1, $2, 'draft', $3)
         RETURNING id`,
        [
          context.metadata.flag_title,
          generateSlug(context.metadata.flag_title),
          context.metadata.admin_id,
        ]
      );
      flag_id = flag_result.rows[0].id;
      rollback.database_records.push(flag_id);
    }

    // Create variant (if needed)
    let variant_id = context.metadata.variant_id;
    
    if (!variant_id && flag_id && context.metadata.variant_type) {
      const variant_result = await client.query(
        `INSERT INTO flag_variants (flag_id, variant_type, is_default)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [flag_id, context.metadata.variant_type, context.metadata.is_default || false]
      );
      variant_id = variant_result.rows[0].id;
      rollback.database_records.push(variant_id);
    }

    // Get format ID
    const format_result = await client.query(
      'SELECT id FROM media_formats WHERE format_code = $1',
      [context.format]
    );
    const format_id = format_result.rows[0].id;

    // Create media asset record
    const asset_result = await client.query(
      `INSERT INTO media_assets (
         variant_id, format_id, file_name, file_path, file_url,
         file_size_bytes, mime_type, width, height, aspect_ratio,
         quality_level, metadata, checksum, processing_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'completed')
       RETURNING id`,
      [
        variant_id,
        format_id,
        context.file_name,
        urls.original,
        urls.original,
        context.file_size,
        context.mime_type,
        metadata.width || undefined,
        metadata.height || undefined,
        metadata.width && metadata.height ? metadata.width / metadata.height : undefined,
        'original',
        JSON.stringify(metadata),
        context.checksum,
      ]
    );

    const asset_id = asset_result.rows[0].id;
    rollback.database_records.push(asset_id);

    // Update temp file status
    await client.query(
      'UPDATE upload_temp_files SET status = $1, asset_id = $2 WHERE id = $3',
      ['completed', asset_id, context.temp_file_id]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Rollback function
async function rollbackUpload(rollback: RollbackContext): Promise<void> {
  console.log('Rolling back upload:', rollback);

  // Delete files from storage
  const storage = createStorageProvider({
    type: process.env.STORAGE_TYPE === 's3' ? 's3' : 'local',
  });

  for (const file_path of rollback.files_created) {
    try {
      await storage.delete(file_path);
    } catch (error) {
      console.error(`Failed to delete file ${file_path}:`, error);
    }
  }

  // Purge CDN (optional, files already deleted)
  // CDN will eventually expire, but we can purge for immediate effect

  // Delete database records (in reverse order)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const record_id of rollback.database_records.reverse()) {
      // Determine table based on ID pattern or use a mapping
      // For simplicity, delete from all possible tables
      await client.query('DELETE FROM media_assets WHERE id = $1', [record_id]);
      await client.query('DELETE FROM flag_variants WHERE id = $1', [record_id]);
      await client.query('DELETE FROM flags WHERE id = $1', [record_id]);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database rollback error:', error);
  } finally {
    client.release();
  }

  // Execute cleanup actions
  for (const action of rollback.cleanup_actions) {
    try {
      await action();
    } catch (error) {
      console.error('Cleanup action error:', error);
    }
  }
}

// Helper functions
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function cleanupTempFiles(temp_path: string): Promise<void> {
  try {
    if (existsSync(temp_path)) {
      const { rm } = await import('fs/promises');
      await rm(temp_path, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Temp file cleanup error:', error);
  }
}

async function quarantineFile(file_path: string, file_name: string): Promise<string> {
  const quarantine_dir = process.env.QUARANTINE_DIR || './quarantine';
  const { mkdir } = await import('fs/promises');
  await mkdir(quarantine_dir, { recursive: true });

  const quarantine_path = `${quarantine_dir}/${Date.now()}_${file_name}`;
  const { copyFile } = await import('fs/promises');
  await copyFile(file_path, quarantine_path);

  return quarantine_path;
}

async function notifyAdmin(subject: string, data: Record<string, any>): Promise<void> {
  // Implement admin notification (email, webhook, etc.)
  console.log(`Admin notification: ${subject}`, data);
}

// Custom error classes
class SecurityError extends Error {
  constructor(message: string, public details: Record<string, any>) {
    super(message);
    this.name = 'SecurityError';
  }
}

export { SecurityError };
