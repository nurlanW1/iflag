# Upload Pipeline Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
cd apps/backend
npm install bull ioredis @aws-sdk/client-cloudfront
```

### 2. Setup Redis

**Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Environment:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Setup ClamAV (Optional)

**Docker:**
```bash
docker run -d -p 3310:3310 clamav/clamav:latest
```

**Environment:**
```env
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
VIRUS_SCANNER=clamav
```

### 4. Run Database Migration

```bash
psql $DATABASE_URL -f src/db/schema-upload.sql
```

### 5. Start Job Processor

The job processor starts automatically with the backend server, or run separately:

```bash
node dist/upload/job-processor.js
```

---

## API Usage Examples

### Chunked Upload (Large Files)

```javascript
// 1. Initiate upload
const initiateResponse = await fetch('/api/admin/upload/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    file_name: 'large-flag.mp4',
    file_size: 104857600, // 100MB
    mime_type: 'video/mp4',
    metadata: {
      flag_title: 'United States Flag',
      variant_type: 'waving',
    },
  }),
});

const { upload_id, chunk_size } = await initiateResponse.json();

// 2. Upload chunks
const file = fileInput.files[0];
const totalChunks = Math.ceil(file.size / chunk_size);

for (let i = 0; i < totalChunks; i++) {
  const start = i * chunk_size;
  const end = Math.min(start + chunk_size, file.size);
  const chunk = file.slice(start, end);

  const formData = new FormData();
  formData.append('upload_id', upload_id);
  formData.append('chunk_number', i.toString());
  formData.append('chunk_data', chunk);

  await fetch('/api/admin/upload/chunk', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
}

// 3. Complete upload
const completeResponse = await fetch('/api/admin/upload/complete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    upload_id,
    checksum: await calculateSHA256(file),
  }),
});

const result = await completeResponse.json();
```

### Direct Upload (Small Files)

```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('metadata', JSON.stringify({
  flag_title: 'United States Flag',
  variant_type: 'flat',
  is_premium: true,
}));

const response = await fetch('/api/admin/upload/direct', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const { uploads } = await response.json();
```

### Check Status

```javascript
const statusResponse = await fetch(`/api/admin/upload/status/${upload_id}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const status = await statusResponse.json();
console.log(`Status: ${status.status}, Progress: ${status.progress_percent}%`);
```

---

## Error Handling Examples

### Handle Upload Errors

```javascript
try {
  const response = await fetch('/api/admin/upload/direct', { ... });
  const data = await response.json();
  
  if (data.error) {
    if (data.error.code === 'VALIDATION_ERROR') {
      // Show validation error to user
      alert(data.error.message);
    } else if (data.error.code === 'SECURITY_ERROR') {
      // Virus detected - notify admin
      alert('File rejected: Security threat detected');
    } else if (data.error.retryable) {
      // Retry after delay
      setTimeout(() => retryUpload(), data.error.retry_after * 1000);
    }
  }
} catch (error) {
  console.error('Upload failed:', error);
}
```

---

## Monitoring

### Check Queue Status

```javascript
// Get queue metrics
const queue = uploadQueue;
const waiting = await queue.getWaitingCount();
const active = await queue.getActiveCount();
const completed = await queue.getCompletedCount();
const failed = await queue.getFailedCount();

console.log(`Queue: ${waiting} waiting, ${active} active, ${completed} completed, ${failed} failed`);
```

### Retry Failed Jobs

```javascript
const failedJobs = await uploadQueue.getFailed();
for (const job of failedJobs) {
  await job.retry();
}
```

---

## Production Checklist

- [ ] Redis configured and running
- [ ] ClamAV or VirusTotal configured
- [ ] Storage (S3/local) configured
- [ ] CDN credentials configured
- [ ] Job processor running
- [ ] Monitoring set up
- [ ] Error alerts configured
- [ ] Cleanup cron job scheduled
- [ ] Backup strategy in place

---

This implementation provides a complete, production-ready upload pipeline with all necessary components.
