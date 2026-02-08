# Cloud Storage & Delivery Architecture
## Production-Ready CDN & Storage Strategy

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN (CloudFront/Cloudflare)                │
│  - Edge caching                                             │
│  - DDoS protection                                          │
│  - SSL/TLS termination                                      │
│  - Geographic distribution                                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Origin       │   │ Origin       │   │ Origin       │
│ (S3 Bucket)  │   │ (S3 Bucket)  │   │ (S3 Bucket)  │
│ Vectors      │   │ Images       │   │ Videos       │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION SERVER (Backend)                    │
│  - Signed URL generation                                     │
│  - Access control                                            │
│  - Download tracking                                         │
│  - Cache invalidation                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Storage Structure

### S3 Bucket Organization

```
s3://flagstock-assets/
│
├── vectors/
│   ├── {flag_id}/
│   │   ├── {variant_id}/
│   │   │   ├── original/
│   │   │   │   ├── {asset_id}.svg
│   │   │   │   └── {asset_id}.eps
│   │   │   ├── preview/
│   │   │   │   ├── {asset_id}_thumbnail.png
│   │   │   │   ├── {asset_id}_preview.png
│   │   │   │   └── {asset_id}_large.png
│   │   │   └── watermarked/
│   │   │       └── {asset_id}_watermarked.png
│
├── rasters/
│   ├── {flag_id}/
│   │   ├── {variant_id}/
│   │   │   ├── original/
│   │   │   │   ├── {asset_id}_1920x1080.png
│   │   │   │   ├── {asset_id}_3840x2160.png
│   │   │   │   └── {asset_id}_7680x4320.png
│   │   │   ├── preview/
│   │   │   │   ├── {asset_id}_thumbnail.webp
│   │   │   │   ├── {asset_id}_preview.webp
│   │   │   │   └── {asset_id}_large.webp
│   │   │   └── watermarked/
│   │   │       └── {asset_id}_watermarked.png
│
├── videos/
│   ├── {flag_id}/
│   │   ├── {variant_id}/
│   │   │   ├── original/
│   │   │   │   ├── {asset_id}_1080p.mp4
│   │   │   │   ├── {asset_id}_4k.mp4
│   │   │   │   └── {asset_id}_1080p.webm
│   │   │   ├── preview/
│   │   │   │   ├── {asset_id}_thumbnail.jpg
│   │   │   │   ├── {asset_id}_preview_720p.mp4
│   │   │   │   └── {asset_id}_preview_watermarked.mp4
│   │   │   └── hls/
│   │   │       ├── {asset_id}_master.m3u8
│   │   │       └── {asset_id}_playlist_*.m3u8
│
└── temp/
    └── uploads/
        └── {upload_id}/
            └── {temp_files}
```

### Storage Classes

**Standard (Hot Storage)**:
- Active assets (published flags)
- Frequently accessed
- Low latency requirement

**Intelligent-Tiering**:
- Older assets
- Seasonal content
- Automatic cost optimization

**Glacier (Cold Storage)**:
- Archived assets
- Historical content
- Rarely accessed

---

## CDN Strategy

### CloudFront Distribution Configuration

**Distribution Settings**:
- Origin: S3 bucket (OAC - Origin Access Control)
- Price Class: Use all edge locations
- SSL Certificate: ACM certificate
- HTTP/2 and HTTP/3 enabled
- Compression: Gzip and Brotli

**Cache Behaviors**:

1. **Vectors (SVG, EPS)**
   - Path Pattern: `/vectors/*`
   - TTL: 1 year (immutable)
   - Compress: Yes
   - Headers: Cache-Control: public, max-age=31536000, immutable

2. **Raster Images**
   - Path Pattern: `/rasters/*`
   - TTL: 30 days
   - Compress: Yes (WebP)
   - Headers: Cache-Control: public, max-age=2592000

3. **Videos**
   - Path Pattern: `/videos/*`
   - TTL: 7 days
   - Compress: No
   - Range requests: Yes
   - Headers: Cache-Control: public, max-age=604800

4. **Previews**
   - Path Pattern: `*/preview/*`
   - TTL: 1 day
   - Compress: Yes
   - Headers: Cache-Control: public, max-age=86400

5. **Watermarked**
   - Path Pattern: `*/watermarked/*`
   - TTL: 1 hour
   - Compress: Yes
   - Headers: Cache-Control: public, max-age=3600

### Cloudflare Alternative

**Benefits**:
- Lower cost
- Better DDoS protection
- More edge locations
- Better analytics

**Configuration**:
- Page Rules for cache control
- Workers for custom logic
- Image optimization (Polish)
- Video streaming (Stream)

---

## Secure Download Links

### Presigned URL Strategy

**Use Cases**:
1. **Public Free Assets**: Long-lived presigned URLs (7 days)
2. **Premium Assets**: Short-lived presigned URLs (15 minutes)
3. **Watermarked Previews**: Medium-lived URLs (1 hour)

**Implementation**:
```typescript
// Generate presigned URL
const url = s3.getSignedUrl('getObject', {
  Bucket: bucketName,
  Key: objectKey,
  Expires: expiresInSeconds,
  ResponseContentDisposition: `attachment; filename="${filename}"`,
});
```

### Token-Based Access

**Flow**:
1. User requests download
2. Backend validates access
3. Backend generates short-lived token
4. Token included in CDN URL
5. CDN validates token (via Lambda@Edge or Cloudflare Worker)
6. Serve asset if valid

**Token Structure**:
```
https://cdn.flagstock.com/assets/{path}?token={jwt}&expires={timestamp}
```

**JWT Payload**:
```json
{
  "asset_id": "uuid",
  "user_id": "uuid",
  "format_id": "uuid",
  "type": "free" | "premium" | "watermarked",
  "exp": 1234567890,
  "iat": 1234567800
}
```

---

## Anti-Hotlinking

### Strategy 1: Referrer Checking

**CloudFront Lambda@Edge**:
```javascript
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const referer = request.headers['referer']?.[0]?.value || '';
  
  const allowedDomains = [
    'flagstock.com',
    'www.flagstock.com',
    'admin.flagstock.com'
  ];
  
  const isAllowed = allowedDomains.some(domain => 
    referer.includes(domain)
  );
  
  if (!isAllowed && referer) {
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Hotlinking not allowed',
    };
  }
  
  return request;
};
```

### Strategy 2: Signed URLs Only

**Implementation**:
- All asset URLs are presigned
- URLs expire after short time
- Cannot be shared or embedded
- Backend controls access

### Strategy 3: Token Validation

**Cloudflare Worker**:
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Token required', { status: 403 });
  }
  
  // Validate token
  const isValid = await validateToken(token);
  if (!isValid) {
    return new Response('Invalid token', { status: 403 });
  }
  
  // Check referer
  const referer = request.headers.get('referer');
  if (referer && !isAllowedDomain(referer)) {
    return new Response('Hotlinking not allowed', { status: 403 });
  }
  
  // Fetch from origin
  return fetch(request);
}
```

### Strategy 4: CORS Configuration

**S3 CORS Policy**:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://flagstock.com",
        "https://www.flagstock.com"
      ],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**CloudFront Headers**:
- Add `Access-Control-Allow-Origin` header
- Restrict to specific domains
- Block cross-origin requests for assets

---

## Cache Invalidation

### Invalidation Strategies

**1. Automatic Invalidation**:
- On asset update: Invalidate specific paths
- On variant change: Invalidate variant folder
- On flag update: Invalidate flag folder

**2. Version-Based Caching**:
- Include version in filename: `{asset_id}_v2.svg`
- New version = new URL = cache miss
- Old versions remain cached

**3. Cache Tags**:
- Tag assets with metadata
- Invalidate by tag (e.g., all flags in category)
- Useful for bulk updates

### CloudFront Invalidation

**API Call**:
```typescript
const invalidation = await cloudfront.createInvalidation({
  DistributionId: distributionId,
  InvalidationBatch: {
    Paths: {
      Quantity: paths.length,
      Items: paths,
    },
    CallerReference: `invalidation-${Date.now()}`,
  },
});
```

**Invalidation Patterns**:
- Single asset: `/vectors/{flag_id}/{variant_id}/original/{asset_id}.svg`
- All variants: `/vectors/{flag_id}/*`
- All formats: `/vectors/{flag_id}/{variant_id}/*`
- All previews: `*/preview/*`

**Cost Optimization**:
- Batch invalidations (up to 3000 paths)
- Use wildcards when possible
- Schedule invalidations during low traffic

### Cloudflare Cache Purge

**API Call**:
```typescript
await fetch('https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    files: urls, // Array of URLs to purge
  }),
});
```

**Purge Options**:
- Purge by URL
- Purge by tag
- Purge everything (emergency)

---

## Performance Optimizations

### Image Optimization

**Format Conversion**:
- PNG → WebP (modern browsers)
- JPEG → WebP (better compression)
- Serve AVIF for supported browsers

**Responsive Images**:
- Generate multiple sizes
- Use `srcset` in HTML
- CDN serves appropriate size

**Lazy Loading**:
- Load previews on demand
- Progressive image loading
- Placeholder images

### Video Optimization

**Adaptive Bitrate Streaming**:
- HLS (HTTP Live Streaming)
- DASH (Dynamic Adaptive Streaming)
- Multiple quality levels

**Video Compression**:
- H.264 for compatibility
- H.265/HEVC for efficiency
- VP9/AV1 for modern browsers

**Thumbnail Generation**:
- Extract frame at 10% of video
- Generate multiple sizes
- Cache thumbnails

### Vector Optimization

**SVG Optimization**:
- Minify SVG code
- Remove unnecessary metadata
- Compress with gzip/brotli

**EPS Handling**:
- Convert to PNG for preview
- Serve original EPS for download
- Cache converted previews

---

## Security Measures

### Access Control

**IAM Policies**:
- Read-only access for CDN
- Write access only for backend
- No public read access

**Origin Access Control (OAC)**:
- CloudFront only access
- Direct S3 access blocked
- Secure origin communication

### DDoS Protection

**CloudFront Shield**:
- AWS Shield Standard (included)
- AWS Shield Advanced (optional)
- Rate limiting

**Cloudflare**:
- DDoS protection (included)
- Rate limiting
- Bot management

### Encryption

**At Rest**:
- S3 server-side encryption (SSE-S3)
- Or SSE-KMS for key management
- Encryption by default

**In Transit**:
- TLS 1.2+ required
- HTTPS only
- HSTS headers

---

## Monitoring & Analytics

### Metrics to Track

**Storage**:
- Total storage used
- Storage by type (vector/raster/video)
- Storage growth rate
- Cost per GB

**CDN**:
- Cache hit ratio
- Bandwidth usage
- Request count
- Error rates
- Geographic distribution

**Performance**:
- Time to first byte (TTFB)
- Download speeds
- Cache effectiveness
- Origin requests

### Alerts

**Critical**:
- CDN errors > 1%
- Origin errors > 0.5%
- Storage > 90% capacity
- Bandwidth spike > 200%

**Warning**:
- Cache hit ratio < 80%
- Slow downloads (> 5s)
- High invalidation costs

---

## Cost Optimization

### Storage Costs

**Strategies**:
- Use Intelligent-Tiering for older assets
- Archive unused assets to Glacier
- Compress assets before upload
- Delete temporary files regularly

### CDN Costs

**Strategies**:
- Optimize cache TTLs
- Use compression
- Minimize invalidations
- Choose appropriate price class

### Data Transfer Costs

**Strategies**:
- Serve from CDN (cheaper than S3)
- Use compression
- Optimize asset sizes
- Implement bandwidth limits

---

## Disaster Recovery

### Backup Strategy

**S3 Versioning**:
- Enable versioning on buckets
- Keep versions for 30 days
- Restore from version if needed

**Cross-Region Replication**:
- Replicate to secondary region
- Automatic failover
- Geographic redundancy

### Recovery Procedures

**Asset Loss**:
1. Check S3 versioning
2. Restore from version
3. Invalidate CDN cache
4. Verify asset availability

**CDN Failure**:
1. Switch to backup CDN
2. Update DNS records
3. Monitor performance
4. Investigate root cause

---

This architecture provides a scalable, secure, and cost-effective solution for storing and delivering digital assets at scale.
