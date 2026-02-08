# Upload Pipeline Implementation Summary

## Complete Upload Pipeline Architecture

### Pipeline Flow

```
1. File Upload
   ├─ Chunked Upload (>50MB)
   │  ├─ POST /api/admin/upload/initiate
   │  ├─ POST /api/admin/upload/chunk (multiple)
   │  └─ POST /api/admin/upload/complete
   │
   └─ Direct Upload (<50MB)
      └─ POST /api/admin/upload/direct

2. Format Validation
   ├─ Magic number check
   ├─ MIME type verification
   └─ Format-specific validation

3. Virus/Security Scan
   ├─ ClamAV (local)
   └─ VirusTotal API (cloud alternative)

4. Metadata Extraction
   ├─ Image: Sharp (dimensions, color mode, DPI)
   ├─ Video: FFprobe (duration, bitrate, codec)
   └─ Vector: Parse SVG/EPS (viewBox, dimensions)

5. Preview Generation
   ├─ Thumbnail (300x200)
   ├─ Preview (800x533)
   └─ Large Preview (1920x1280)

6. Storage Upload
   ├─ Original file
   ├─ Preview files
   └─ Organized by format type

7. CDN Cache Update
   └─ Purge cache for new URLs

8. Finalization
   ├─ Create database records
   ├─ Link to flag/variant
   └─ Update status (draft/published)
```

---

## API Endpoints

### 1. POST /api/admin/upload/initiate
**Purpose**: Initialize chunked upload session

**Request:**
```json
{
  "file_name": "usa-flag.svg",
  "file_size": 52428800,
  "mime_type": "image/svg+xml",
  "metadata": {
    "flag_title": "United States Flag",
    "variant_type": "flat"
  }
}
```

**Response:**
```json
{
  "upload_id": "abc123...",
  "chunk_size": 10485760,
  "expires_at": "2024-01-15T12:00:00Z"
}
```

### 2. POST /api/admin/upload/chunk
**Purpose**: Upload file chunk

**Request:**
- Multipart form data
- `upload_id`: Session ID
- `chunk_number`: Chunk index
- `chunk_data`: Binary chunk

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
  "upload_id": "abc123...",
  "checksum": "sha256:..."
}
```

**Response:**
```json
{
  "file_id": "xyz789...",
  "processing_job_id": "job123...",
  "status": "processing"
}
```

### 4. POST /api/admin/upload/direct
**Purpose**: Direct upload for small files

**Request:**
- Multipart form data
- `files[]`: Array of files
- `metadata`: JSON metadata

**Response:**
```json
{
  "uploads": [
    {
      "file_name": "usa-flag.svg",
      "file_id": "xyz789...",
      "processing_job_id": "job123...",
      "status": "processing"
    }
  ]
}
```

### 5. GET /api/admin/upload/status/:upload_id
**Purpose**: Check upload/processing status

**Response:**
```json
{
  "status": "processing",
  "stage": "preview_generation",
  "progress": 60,
  "errors": []
}
```

---

## Async Processing

### Job Queue System

**Technology**: Bull (Redis-based job queue)

**Job Types:**
1. `file_upload` - Main upload pipeline
2. `format_validation` - Validate file format
3. `virus_scan` - Security scanning
4. `metadata_extraction` - Extract metadata
5. `preview_generation` - Generate previews
6. `storage_upload` - Upload to storage
7. `cdn_purge` - Purge CDN cache
8. `asset_finalization` - Create database records

**Job Priority:**
- Critical: virus_scan (must complete)
- High: format_validation, metadata_extraction
- Normal: preview_generation, storage_upload
- Low: cdn_purge, asset_finalization

**Retry Strategy:**
- Max retries: 3
- Exponential backoff: 5s, 10s, 20s
- Remove on complete: true
- Keep on fail: true (for analysis)

### Processing Stages

Each stage updates job progress:
- 0-10%: Format validation
- 10-20%: Virus scan
- 20-30%: Metadata extraction
- 30-50%: Preview generation
- 50-70%: Storage upload
- 70-85%: CDN purge
- 85-100%: Finalization

---

## Error Handling

### Error Categories

1. **Validation Errors** (400)
   - Invalid format
   - File too large
   - Missing metadata
   - **Action**: Immediate rejection, cleanup

2. **Security Errors** (403)
   - Virus detected
   - Malicious content
   - **Action**: Quarantine, notify admin, rollback

3. **Processing Errors** (500)
   - Preview generation failed
   - Storage upload failed
   - **Action**: Retry with backoff, rollback on max retries

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

---

## Rollback Strategy

### Rollback Triggers

1. **Validation Failure**
   - Delete uploaded chunks/files
   - Remove database records
   - Cleanup temp storage

2. **Virus Detection**
   - Quarantine file
   - Rollback transaction
   - Notify admin
   - Blacklist file hash

3. **Processing Failure**
   - Delete generated previews
   - Delete uploaded files
   - Rollback database transaction
   - Cleanup temp files

4. **Storage Failure**
   - Delete local files
   - Rollback transaction
   - Retry or fail

5. **Finalization Failure**
   - Mark as failed
   - Keep files for manual retry
   - Allow admin intervention

### Rollback Implementation

**Rollback Context:**
```typescript
{
  files_created: string[],      // Files to delete
  database_records: string[],   // Records to delete
  cdn_urls: string[],           // URLs to purge
  cleanup_actions: Function[]  // Custom cleanup
}
```

**Rollback Process:**
1. Delete files from storage (all created files)
2. Purge CDN cache (if URLs were created)
3. Rollback database transaction
4. Execute custom cleanup actions
5. Update job status to 'rolled_back'

---

## Security Features

### File Upload Security

1. **Size Limits**:
   - Per file: 500MB
   - Per session: 2GB
   - Rate limit: 10 uploads/minute

2. **Format Validation**:
   - Whitelist approach
   - MIME type check
   - Magic number verification
   - Format-specific validation

3. **Path Traversal Prevention**:
   - Sanitize filenames
   - Validate paths
   - No user-controlled paths

4. **Virus Scanning**:
   - Mandatory for all uploads
   - ClamAV or VirusTotal
   - Quarantine infected files
   - Blacklist file hashes

### Access Control

- Admin-only endpoints
- JWT authentication
- Rate limiting per user
- IP restrictions (optional)

---

## Performance Optimizations

### Chunked Upload

- **Chunk Size**: 10MB (configurable)
- **Parallel Chunks**: Client can upload multiple chunks in parallel
- **Resume Support**: Can resume failed uploads
- **Checksum Verification**: SHA-256 per chunk + final file

### Processing

- **Parallel Processing**: Independent stages run concurrently
- **Caching**: Cache format definitions, metadata
- **Streaming**: Process files as chunks arrive
- **Background Jobs**: Non-blocking processing

### Storage

- **Direct Upload**: For small files (<50MB)
- **Chunked Upload**: For large files (>50MB)
- **S3 Multipart**: Use S3 multipart upload for very large files
- **CDN**: Serve from CDN, not origin

---

## Monitoring

### Metrics

1. **Upload Metrics**:
   - Success rate
   - Average upload time
   - File size distribution
   - Format distribution

2. **Processing Metrics**:
   - Queue length
   - Processing time per stage
   - Failure rate by stage
   - Retry count

3. **Storage Metrics**:
   - Storage usage
   - Upload bandwidth
   - CDN cache hit rate

### Logging

- Structured JSON logging
- Correlation IDs
- Stage-level logging
- Error tracking

---

## Implementation Checklist

- [x] Upload service (chunked + direct)
- [x] Format validation
- [x] Virus scanning (ClamAV/VirusTotal)
- [x] Metadata extraction
- [x] Preview generation
- [x] Storage integration
- [x] CDN purge
- [x] Database records
- [x] Error handling
- [x] Rollback strategy
- [ ] Job queue integration (Bull/Redis)
- [ ] Admin notifications
- [ ] Monitoring dashboard
- [ ] Automated cleanup jobs

---

## Dependencies Required

```json
{
  "bull": "^4.0.0",
  "ioredis": "^5.0.0",
  "clamscan": "^2.0.0",
  "sharp": "^0.33.5",
  "fluent-ffmpeg": "^2.1.2",
  "ffmpeg-static": "^5.2.0"
}
```

---

This pipeline provides a production-ready upload system with comprehensive error handling, security scanning, and rollback capabilities.
