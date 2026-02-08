# Asset Strategy Implementation Guide

This guide provides step-by-step instructions for implementing the comprehensive asset strategy defined in `ASSET_STRATEGY.md`.

## Phase 1: Database Setup

### 1.1 Run Enhanced Schema Migration

```bash
cd apps/backend
psql $DATABASE_URL -f src/db/schema-assets.sql
```

This creates:
- `asset_files` table for file variants
- `asset_processing_queue` table for async processing
- `asset_format_stats` table for analytics
- Enhanced `assets` table with format metadata

### 1.2 Verify Schema

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('asset_files', 'asset_processing_queue', 'asset_format_stats');

-- Check assets table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'assets' 
AND column_name IN ('primary_format', 'available_formats', 'color_mode');
```

## Phase 2: Install Processing Dependencies

### 2.1 Backend Dependencies

```bash
cd apps/backend
npm install sharp ffmpeg-static fluent-ffmpeg
```

### 2.2 System Dependencies (for production)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg inkscape ghostscript
```

**macOS:**
```bash
brew install ffmpeg inkscape ghostscript
```

**Docker:**
Add to Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y \
    ffmpeg \
    inkscape \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*
```

## Phase 3: Storage Configuration

### 3.1 Local Storage (Development)

Update `.env`:
```env
STORAGE_TYPE=local
STORAGE_BASE_URL=http://localhost:4000/uploads
STORAGE_BASE_PATH=./uploads
```

Create directories:
```bash
mkdir -p uploads/assets/{vectors,rasters,videos,previews}
```

### 3.2 S3 Storage (Production)

Update `.env`:
```env
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

## Phase 4: Implement Processing Pipeline

### 4.1 Create Processing Worker

Create `apps/backend/src/workers/asset-processor.ts`:

```typescript
import { getNextJob, updateJobStatus } from '../assets/processing-queue.service';
import { processPreview, processWatermark, processConvert } from '../assets/processors';

async function processJobs() {
  while (true) {
    const job = await getNextJob();
    if (!job) {
      await sleep(5000); // Wait 5 seconds if no jobs
      continue;
    }
    
    try {
      await updateJobStatus(job.id, 'processing', 0);
      
      switch (job.job_type) {
        case 'preview':
          await processPreview(job);
          break;
        case 'watermark':
          await processWatermark(job);
          break;
        case 'convert':
          await processConvert(job);
          break;
        // ... other job types
      }
      
      await updateJobStatus(job.id, 'completed', 100);
    } catch (error) {
      await updateJobStatus(job.id, 'failed', undefined, error.message);
    }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start worker
processJobs();
```

### 4.2 Implement Processors

Create processor functions for each job type in `apps/backend/src/assets/processors/`.

## Phase 5: Update Asset Upload

### 5.1 Enhanced Upload Endpoint

Modify `apps/backend/src/assets/asset.routes.ts` to:
1. Accept file uploads
2. Detect format
3. Create asset record
4. Create original file record
5. Queue processing jobs

### 5.2 Upload Handler

```typescript
import multer from 'multer';
import { createAssetFile } from './asset-file.service';
import { createProcessingJob } from './processing-queue.service';
import { detectFormatFromFilename } from 'asset-types';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Detect format
  const format = detectFormatFromFilename(file.originalname);
  if (!format) {
    return res.status(400).json({ error: 'Unsupported file format' });
  }
  
  // Create asset
  const asset = await createAsset({ ...req.body, primary_format: format });
  
  // Create original file
  const assetFile = await createAssetFile({
    asset_id: asset.id,
    format,
    variant: 'original',
    file_buffer: file.buffer,
    // ... extract metadata
  });
  
  // Queue processing jobs
  await createProcessingJob({
    asset_id: asset.id,
    asset_file_id: assetFile.id,
    job_type: 'preview',
    priority: 1, // High priority
  });
  
  if (asset.is_premium) {
    await createProcessingJob({
      asset_id: asset.id,
      asset_file_id: assetFile.id,
      job_type: 'watermark',
      priority: 2,
    });
  }
  
  res.json({ asset, file: assetFile });
});
```

## Phase 6: Format-Specific Processors

### 6.1 SVG Processor

```typescript
// apps/backend/src/assets/processors/svg.processor.ts
import sharp from 'sharp';
import { addWatermarkToSVG } from 'watermarking';
import { createAssetFile } from '../asset-file.service';

export async function processSVG(job: ProcessingJob) {
  // Load original SVG
  const svgContent = await loadFile(job.asset_file_id);
  
  // Generate previews (rasterize)
  const previews = [
    { size: '300x200', width: 300, height: 200 },
    { size: '800x533', width: 800, height: 533 },
  ];
  
  for (const preview of previews) {
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .resize(preview.width, preview.height)
      .png()
      .toBuffer();
    
    await createAssetFile({
      asset_id: job.asset_id,
      format: 'png',
      variant: 'preview',
      size: preview.size,
      file_buffer: pngBuffer,
      width: preview.width,
      height: preview.height,
    });
  }
  
  // Generate watermarked SVG
  const watermarkedSVG = addWatermarkToSVG(svgContent);
  // ... save watermarked version
}
```

### 6.2 EPS Processor

```typescript
// apps/backend/src/assets/processors/eps.processor.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function processEPS(job: ProcessingJob) {
  // Convert EPS to SVG using Inkscape
  const inputPath = getFilePath(job.asset_file_id);
  const outputPath = inputPath.replace('.eps', '.svg');
  
  await execAsync(`inkscape --export-type=svg "${inputPath}" -o "${outputPath}"`);
  
  // Process converted SVG (same as SVG processor)
  // ...
}
```

### 6.3 PNG/JPEG Processor

```typescript
// apps/backend/src/assets/processors/raster.processor.ts
import sharp from 'sharp';
import { addWatermarkToImage } from 'watermarking';

export async function processRaster(job: ProcessingJob) {
  const imageBuffer = await loadFileBuffer(job.asset_file_id);
  
  // Generate multiple sizes
  const sizes = [
    { size: '300x200', width: 300, height: 200 },
    { size: '800x533', width: 800, height: 533 },
    { size: '1920x1280', width: 1920, height: 1280 },
  ];
  
  for (const { size, width, height } of sizes) {
    // Resize
    const resized = await sharp(imageBuffer)
      .resize(width, height, { fit: 'contain' })
      .toBuffer();
    
    await createAssetFile({
      asset_id: job.asset_id,
      format: 'png',
      variant: 'preview',
      size,
      file_buffer: resized,
      width,
      height,
    });
    
    // Watermarked version
    const watermarked = await addWatermarkToImage(resized);
    await createAssetFile({
      asset_id: job.asset_id,
      format: 'png',
      variant: 'watermarked',
      size,
      file_buffer: watermarked,
      width,
      height,
    });
  }
  
  // Generate WebP versions
  // ...
}
```

### 6.4 Video Processor

```typescript
// apps/backend/src/assets/processors/video.processor.ts
import ffmpeg from 'fluent-ffmpeg';

export async function processVideo(job: ProcessingJob) {
  const inputPath = getFilePath(job.asset_file_id);
  
  // Generate multiple quality profiles
  const profiles = [
    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
    { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
    { name: '480p', width: 854, height: 480, bitrate: '1000k' },
  ];
  
  for (const profile of profiles) {
    const outputPath = inputPath.replace('.mp4', `-${profile.name}.mp4`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size(`${profile.width}x${profile.height}`)
        .videoBitrate(profile.bitrate)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    // Create file record
    // ...
  }
  
  // Generate preview (5-10 second clip)
  // Generate poster image (first frame)
  // Apply watermark to preview
}
```

## Phase 7: Download System

### 7.1 Enhanced Download Endpoint

Update download endpoint to:
1. Check user premium status
2. Select best file variant
3. Track download
4. Return appropriate file

```typescript
router.get('/:id/download', optionalAuth, async (req, res) => {
  const asset = await getAssetById(req.params.id);
  const hasPremium = req.user ? await hasActivePremiumSubscription(req.user.userId) : false;
  
  // Get best file for user
  const file = await getBestFileForDownload(
    asset.id,
    asset.primary_format,
    hasPremium
  );
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Track download
  await recordDownload(asset.id, req.user?.userId, hasPremium ? 'premium' : 'watermarked');
  
  // Redirect to CDN or serve file
  res.redirect(file.file_url);
});
```

## Phase 8: CDN Integration

### 8.1 Cloudflare Setup

1. Create Cloudflare account
2. Add domain
3. Configure cache rules:
   - Cache images/videos: 1 year
   - Cache HTML: 1 hour
4. Enable auto-minify
5. Enable Brotli compression

### 8.2 S3 + CloudFront Setup

1. Create S3 bucket
2. Enable CloudFront distribution
3. Configure cache behaviors
4. Set up origin access
5. Update file URLs to use CloudFront domain

## Phase 9: Monitoring & Analytics

### 9.1 Track Format Usage

```typescript
// Update format stats on download
await pool.query(
  `INSERT INTO asset_format_stats (asset_id, format, variant, download_count, total_bytes_downloaded)
   VALUES ($1, $2, $3, 1, $4)
   ON CONFLICT (asset_id, format, variant)
   DO UPDATE SET
     download_count = asset_format_stats.download_count + 1,
     total_bytes_downloaded = asset_format_stats.total_bytes_downloaded + $4,
     last_downloaded_at = CURRENT_TIMESTAMP`,
  [asset_id, format, variant, file_size]
);
```

### 9.2 Processing Queue Monitoring

Create dashboard to monitor:
- Queue length
- Processing times
- Error rates
- Job priorities

## Phase 10: Testing

### 10.1 Unit Tests

Test each processor:
- SVG → PNG conversion
- EPS → SVG conversion
- Image resizing
- Watermarking
- Video encoding

### 10.2 Integration Tests

Test full pipeline:
- Upload → Process → Download
- Premium vs free access
- Format detection
- File variant selection

### 10.3 Performance Tests

- Processing time benchmarks
- Storage usage
- CDN cache hit rates
- Download speeds

## Phase 11: Deployment

### 11.1 Processing Workers

Deploy separate worker processes:
```bash
# PM2 ecosystem file
module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/index.js',
    },
    {
      name: 'asset-processor',
      script: './dist/workers/asset-processor.js',
      instances: 2, // Scale based on load
    },
  ],
};
```

### 11.2 Environment Variables

Set production environment:
```env
NODE_ENV=production
STORAGE_TYPE=s3
DATABASE_URL=postgresql://...
CDN_URL=https://cdn.flagstock.com
```

## Phase 12: Optimization

### 12.1 Image Optimization

- Enable WebP conversion
- Progressive JPEG
- Responsive images with srcset

### 12.2 Video Optimization

- Enable HLS/DASH streaming
- Thumbnail sprites
- Adaptive bitrate

### 12.3 Caching

- Aggressive CDN caching
- Browser caching headers
- Service worker for offline

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Install system dependencies
2. **Inkscape conversion fails**: Check EPS file validity
3. **Processing queue stuck**: Check worker processes
4. **Storage quota exceeded**: Implement lifecycle policies
5. **CDN cache not updating**: Purge cache on updates

## Next Steps

1. Implement Stripe integration for payments
2. Add email notifications for processing
3. Build admin UI for processing queue
4. Add format conversion API
5. Implement batch processing

---

This implementation guide provides a roadmap for building the complete asset management system. Follow phases sequentially, testing each before moving to the next.
