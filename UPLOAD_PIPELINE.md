# Admin Upload Pipeline Design
## Production-Ready File Upload & Processing System

### Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Server  │────▶│   Storage   │
│  (Browser)  │     │  (Express)   │     │  (S3/Local) │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Job Queue   │
                    │  (Bull/Redis)│
                    └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Scanner    │   │   Processor  │   │   CDN Sync   │
│  (ClamAV)    │   │  (Sharp/FF)  │   │  (Purge API) │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Pipeline Stages

### Stage 1: File Upload
**Purpose**: Accept large files via chunked upload or direct upload

### Stage 2: Format Validation
**Purpose**: Verify file format, size, and basic integrity

### Stage 3: Virus/Security Scan
**Purpose**: Scan for malware and security threats

### Stage 4: Preview Generation
**Purpose**: Generate thumbnails and previews

### Stage 5: Metadata Assignment
**Purpose**: Extract and assign metadata

### Stage 6: Storage
**Purpose**: Store files in permanent storage

### Stage 7: CDN Cache Update
**Purpose**: Invalidate/purge CDN cache

### Stage 8: Publish or Draft
**Purpose**: Finalize asset status

---

## API Endpoints

### 1. POST /api/admin/upload/initiate
**Purpose**: Initialize upload session for large files

**Request:**
```json
{
  "file_name": "usa-flag.svg",
  "file_size": 5242880,
  "mime_type": "image/svg+xml",
  "total_chunks": 5,
  "metadata": {
    "flag_title": "United States Flag",
    "variant_type": "flat"
  }
}
```

**Response:**
```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "chunk_size": 1048576,
  "expires_at": "2024-01-15T12:00:00Z"
}
```

### 2. POST /api/admin/upload/chunk
**Purpose**: Upload file chunk (for large files)

**Request:**
- Multipart form data
- `upload_id`: Upload session ID
- `chunk_number`: Chunk index (0-based)
- `chunk_data`: Binary chunk data

**Response:**
```json
{
  "chunk_received": true,
  "chunks_complete": 3,
  "chunks_total": 5
}
```

### 3. POST /api/admin/upload/complete
**Purpose**: Finalize chunked upload

**Request:**
```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "checksum": "sha256:abc123..."
}
```

**Response:**
```json
{
  "file_id": "660e8400-e29b-41d4-a716-446655440001",
  "processing_job_id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "processing"
}
```

### 4. POST /api/admin/upload/direct
**Purpose**: Direct upload for smaller files (< 50MB)

**Request:**
- Multipart form data
- `files[]`: Array of files
- `flag_title`: Flag title
- `variant_type`: Variant type
- `metadata`: Additional metadata JSON

**Response:**
```json
{
  "uploads": [
    {
      "file_id": "660e8400-e29b-41d4-a716-446655440001",
      "file_name": "usa-flag.svg",
      "processing_job_id": "770e8400-e29b-41d4-a716-446655440002",
      "status": "processing"
    }
  ]
}
```

### 5. GET /api/admin/upload/status/:job_id
**Purpose**: Check processing status

**Response:**
```json
{
  "job_id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "processing",
  "stage": "preview_generation",
  "progress": 60,
  "errors": [],
  "result": null
}
```

### 6. POST /api/admin/upload/batch
**Purpose**: Batch upload multiple files for one flag

**Request:**
- Multipart form data
- `files[]`: Multiple files
- `flag_data`: Flag metadata JSON

**Response:**
```json
{
  "flag_id": "550e8400-e29b-41d4-a716-446655440000",
  "uploads": [
    {
      "file_id": "...",
      "processing_job_id": "...",
      "status": "processing"
    }
  ]
}
```

---

## Async Processing Architecture

### Job Queue System

**Technology**: Bull (Redis-based)

**Job Types:**
1. `file-validation`
2. `virus-scan`
3. `preview-generation`
4. `metadata-extraction`
5. `storage-upload`
6. `cdn-purge`
7. `asset-finalization`

### Job Flow

```
Upload Complete
    │
    ▼
[file-validation] ──▶ [virus-scan] ──▶ [metadata-extraction]
    │                      │                    │
    │                      │                    ▼
    │                      │            [preview-generation]
    │                      │                    │
    │                      │                    ▼
    │                      │            [storage-upload]
    │                      │                    │
    │                      │                    ▼
    │                      │            [cdn-purge]
    │                      │                    │
    │                      │                    ▼
    │                      │            [asset-finalization]
    │                      │                    │
    └──────────────────────┴────────────────────┘
                            │
                            ▼
                    [Complete or Rollback]
```

### Job Priority Levels

- **Critical**: virus-scan (must complete before proceeding)
- **High**: file-validation, metadata-extraction
- **Normal**: preview-generation, storage-upload
- **Low**: cdn-purge, asset-finalization

---

## Error Handling

### Error Categories

1. **Validation Errors** (400)
   - Invalid file format
   - File too large
   - Missing required metadata
   - **Action**: Reject immediately, no processing

2. **Security Errors** (403)
   - Virus detected
   - Malicious content
   - **Action**: Quarantine file, notify admin

3. **Processing Errors** (500)
   - Preview generation failed
   - Storage upload failed
   - **Action**: Retry with exponential backoff

4. **Transient Errors** (503)
   - Service unavailable
   - Rate limiting
   - **Action**: Retry after delay

### Error Response Format

```json
{
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "Preview generation failed",
    "stage": "preview_generation",
    "retryable": true,
    "retry_after": 60,
    "details": {
      "error_type": "ImageProcessingError",
      "error_message": "Invalid image format"
    }
  }
}
```

### Retry Strategy

**Exponential Backoff:**
- Initial delay: 5 seconds
- Max delay: 300 seconds (5 minutes)
- Max retries: 3 attempts
- Backoff multiplier: 2

**Retry Logic:**
```typescript
const retryConfig = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds
  },
  removeOnComplete: true,
  removeOnFail: false, // Keep failed jobs for analysis
};
```

---

## Rollback Strategy

### Transaction Management

**Database Transaction:**
- Start transaction on upload initiation
- Commit only after all stages complete
- Rollback on any critical failure

**File Cleanup:**
- Track all created files
- Delete on rollback
- Cleanup orphaned files periodically

### Rollback Triggers

1. **Validation Failure**: Delete uploaded chunks/files
2. **Virus Detection**: Quarantine file, rollback transaction
3. **Processing Failure**: Delete generated previews, rollback
4. **Storage Failure**: Delete local files, rollback transaction
5. **Finalization Failure**: Mark as failed, allow manual retry

### Rollback Implementation

```typescript
interface RollbackContext {
  upload_id: string;
  files_created: string[];
  database_records: string[];
  cdn_urls: string[];
  cleanup_actions: Array<() => Promise<void>>;
}

async function rollback(context: RollbackContext) {
  // 1. Delete files from storage
  for (const filePath of context.files_created) {
    await storage.delete(filePath);
  }

  // 2. Purge CDN cache
  for (const url of context.cdn_urls) {
    await cdn.purge(url);
  }

  // 3. Delete database records
  await db.transaction(async (tx) => {
    for (const recordId of context.database_records) {
      await tx.delete(recordId);
    }
  });

  // 4. Execute custom cleanup actions
  for (const action of context.cleanup_actions) {
    await action();
  }

  // 5. Update job status
  await jobQueue.updateJobStatus(context.upload_id, 'failed', {
    rolled_back: true,
    rolled_back_at: new Date(),
  });
}
```

---

## Implementation Details

### Stage 1: File Upload

**Chunked Upload (Large Files > 50MB):**
- Client splits file into chunks
- Server validates each chunk
- Server reassembles chunks
- Verify checksum

**Direct Upload (Small Files < 50MB):**
- Single multipart upload
- Stream to temporary storage
- Validate immediately

**Temporary Storage:**
- Local filesystem: `/tmp/uploads/{upload_id}/`
- S3: `temp-uploads/{upload_id}/`
- TTL: 24 hours (auto-cleanup)

### Stage 2: Format Validation

**Validation Checks:**
1. File extension matches MIME type
2. File size within limits
3. Magic number verification (file signature)
4. Format-specific validation:
   - SVG: XML well-formed
   - PNG: Valid PNG header
   - JPEG: Valid JPEG structure
   - MP4: Valid MP4 container

**Implementation:**
```typescript
async function validateFormat(file: Buffer, mimeType: string): Promise<ValidationResult> {
  // 1. Check magic numbers
  const magicNumber = file.slice(0, 16);
  const isValidSignature = checkMagicNumber(magicNumber, mimeType);
  
  // 2. Format-specific validation
  switch (mimeType) {
    case 'image/svg+xml':
      return validateSVG(file);
    case 'image/png':
      return validatePNG(file);
    case 'video/mp4':
      return validateMP4(file);
    // ...
  }
}
```

### Stage 3: Virus/Security Scan

**Scanning Options:**

1. **ClamAV** (Recommended for production)
   - Open-source antivirus
   - Real-time scanning
   - Signature-based detection

2. **Cloud Services** (Alternative)
   - AWS Macie
   - Google Cloud Security Scanner
   - VirusTotal API

**Implementation:**
```typescript
async function scanFile(filePath: string): Promise<ScanResult> {
  const clamav = new ClamAV({
    host: process.env.CLAMAV_HOST || 'localhost',
    port: 3310,
  });

  const result = await clamav.scanFile(filePath);
  
  if (result.isInfected) {
    throw new SecurityError('Virus detected', {
      virus: result.viruses,
      file: filePath,
    });
  }

  return { clean: true };
}
```

**Quarantine:**
- Infected files moved to quarantine directory
- Admin notification sent
- File hash blacklisted

### Stage 4: Preview Generation

**Preview Types:**
- Thumbnail: 300x200px
- Preview: 800x533px
- Large Preview: 1920x1280px

**Processing:**
- Images: Sharp library
- Videos: FFmpeg
- Vectors: Rasterize to PNG

**Watermarking:**
- Apply to preview sizes only
- Non-destructive (original preserved)

### Stage 5: Metadata Extraction

**Extracted Metadata:**
- Dimensions (width, height)
- File size
- Color mode (RGB, CMYK)
- Transparency support
- Duration (for videos)
- Bitrate (for videos)
- Codec (for videos)
- DPI (for print formats)

**Implementation:**
```typescript
async function extractMetadata(file: Buffer, format: string): Promise<Metadata> {
  switch (format) {
    case 'image':
      return await extractImageMetadata(file);
    case 'video':
      return await extractVideoMetadata(file);
    case 'vector':
      return await extractVectorMetadata(file);
  }
}
```

### Stage 6: Storage

**Storage Strategy:**
- **Temporary**: Local/S3 temp directory
- **Permanent**: Organized by format type
  - `assets/vectors/{flag_id}/{variant_id}/{filename}`
  - `assets/rasters/{flag_id}/{variant_id}/{filename}`
  - `assets/videos/{flag_id}/{variant_id}/{filename}`

**Upload Process:**
1. Upload to temporary location
2. Verify upload (checksum)
3. Move to permanent location
4. Update database with URLs

### Stage 7: CDN Cache Update

**CDN Purge:**
- Purge asset URLs
- Purge preview URLs
- Purge thumbnail URLs

**Implementation:**
```typescript
async function purgeCDN(urls: string[]): Promise<void> {
  const cdn = getCDNProvider(); // Cloudflare, CloudFront, etc.
  
  await cdn.purgeUrls(urls);
  
  // Wait for purge to complete (async)
  await cdn.waitForPurge(urls);
}
```

### Stage 8: Publish or Draft

**Finalization:**
- Update asset status
- Create database records
- Index for search
- Send notifications

---

## Status Tracking

### Job Status States

1. **pending**: Job queued, not started
2. **processing**: Currently executing
3. **completed**: Successfully finished
4. **failed**: Failed with error
5. **retrying**: Retrying after failure
6. **rolled_back**: Rolled back due to error

### Progress Tracking

```typescript
interface JobProgress {
  stage: string;
  progress: number; // 0-100
  current_step: string;
  total_steps: number;
  completed_steps: number;
}
```

---

## Security Considerations

### File Upload Security

1. **File Size Limits**:
   - Per file: 500MB
   - Per upload session: 2GB
   - Rate limiting: 10 uploads/minute per user

2. **File Type Validation**:
   - Whitelist approach (only allowed formats)
   - MIME type verification
   - Magic number checking

3. **Path Traversal Prevention**:
   - Sanitize filenames
   - Validate file paths
   - No user-controlled paths

4. **Virus Scanning**:
   - Mandatory for all uploads
   - Quarantine infected files
   - Blacklist file hashes

### Access Control

- Admin-only endpoints
- JWT authentication required
- Rate limiting per user
- IP-based restrictions (optional)

---

## Monitoring & Observability

### Metrics to Track

1. **Upload Metrics**:
   - Upload success rate
   - Average upload time
   - File size distribution
   - Format distribution

2. **Processing Metrics**:
   - Job queue length
   - Average processing time per stage
   - Failure rate by stage
   - Retry count distribution

3. **Storage Metrics**:
   - Storage usage
   - Upload bandwidth
   - CDN cache hit rate

### Logging

- Structured logging (JSON)
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for request tracking
- Audit log for admin actions

---

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: Can scale horizontally
- **Job Workers**: Multiple workers process jobs
- **Storage**: S3-compatible (scales automatically)
- **CDN**: Handles traffic spikes

### Performance Optimization

1. **Parallel Processing**:
   - Process multiple files in parallel
   - Independent stages can run concurrently

2. **Caching**:
   - Cache format definitions
   - Cache metadata extraction results
   - Cache preview generation

3. **Streaming**:
   - Stream large files (don't load into memory)
   - Process chunks as they arrive

---

## Disaster Recovery

### Backup Strategy

- Database: Daily backups
- Storage: Versioned (S3 versioning)
- Job Queue: Redis persistence

### Recovery Procedures

1. **Failed Upload Recovery**:
   - Retry failed jobs
   - Manual intervention for stuck jobs
   - Cleanup orphaned files

2. **Data Corruption**:
   - Verify file checksums
   - Re-generate previews
   - Re-sync with CDN

---

This pipeline design provides a robust, scalable, and secure upload system capable of handling production workloads with proper error handling and rollback capabilities.
