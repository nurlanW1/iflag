# CDN Deployment Guide
## Step-by-Step Setup Instructions

## AWS CloudFront Setup

### 1. Create S3 Bucket

```bash
aws s3 mb s3://flagstock-assets --region us-east-1
aws s3api put-bucket-versioning \
  --bucket flagstock-assets \
  --versioning-configuration Status=Enabled
```

### 2. Configure Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::flagstock-assets/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### 3. Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**cloudfront-config.json**:
```json
{
  "CallerReference": "flagstock-assets-2024",
  "Comment": "Flag Stock Assets CDN",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-flagstock-assets",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 1,
        "Items": ["Origin"]
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-flagstock-assets",
        "DomainName": "flagstock-assets.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "OAC_ID"
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_All"
}
```

### 4. Deploy Lambda@Edge

```bash
# Package function
zip lambda-edge.zip lambda-edge.js node_modules/

# Create function
aws lambda publish-version \
  --function-name anti-hotlink \
  --description "Anti-hotlinking for CloudFront"

# Associate with CloudFront
aws cloudfront update-distribution \
  --id DISTRIBUTION_ID \
  --default-cache-behavior ...
```

---

## Cloudflare Setup

### 1. Add Domain to Cloudflare

1. Add site to Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full mode)

### 2. Configure Page Rules

**Rule 1: Vectors (Long Cache)**
- URL: `flagstock.com/vectors/*`
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year

**Rule 2: Rasters (Medium Cache)**
- URL: `flagstock.com/rasters/*`
- Cache Level: Cache Everything
- Edge Cache TTL: 30 days
- Browser Cache TTL: 30 days

**Rule 3: Videos (Short Cache)**
- URL: `flagstock.com/videos/*`
- Cache Level: Cache Everything
- Edge Cache TTL: 7 days
- Browser Cache TTL: 7 days

### 3. Deploy Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy worker
wrangler publish --name anti-hotlink
```

**wrangler.toml**:
```toml
name = "anti-hotlink"
main = "cloudflare-worker.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ALLOWED_DOMAINS = "flagstock.com,www.flagstock.com" }
secrets = { TOKEN_SECRET = "..." }
```

### 4. Configure Worker Route

- Route: `flagstock.com/vectors/*`, `flagstock.com/rasters/*`, `flagstock.com/videos/*`
- Worker: `anti-hotlink`

---

## Environment Variables

### Backend (.env)

```env
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=flagstock-assets

# CloudFront
CLOUDFRONT_DISTRIBUTION_ID=...
CLOUDFRONT_DOMAIN=cdn.flagstock.com
CLOUDFRONT_ACCESS_KEY_ID=...
CLOUDFRONT_SECRET_ACCESS_KEY=...

# Anti-Hotlinking
ALLOWED_DOMAINS=flagstock.com,www.flagstock.com,admin.flagstock.com
TOKEN_SECRET=your-secret-key-here
REQUIRE_TOKEN=false
ALLOW_EMPTY_REFERER=false
```

---

## Testing

### Test Presigned URLs

```bash
curl "https://cdn.flagstock.com/vectors/flag123/variant456/original/asset789.svg?token=..."
```

### Test Anti-Hotlinking

```bash
# Should work
curl -H "Referer: https://flagstock.com" \
  "https://cdn.flagstock.com/vectors/flag123/variant456/original/asset789.svg"

# Should fail
curl -H "Referer: https://example.com" \
  "https://cdn.flagstock.com/vectors/flag123/variant456/original/asset789.svg"
```

### Test Cache Invalidation

```typescript
const invalidation = await cacheInvalidation.invalidateAsset(
  'flag123',
  'variant456',
  'asset789',
  'vector'
);
console.log('Invalidation ID:', invalidation);
```

---

## Monitoring

### CloudWatch Metrics (CloudFront)

- Requests
- Bytes downloaded
- Error rates
- Cache hit ratio

### Cloudflare Analytics

- Requests
- Bandwidth
- Cache hit ratio
- Geographic distribution

---

## Cost Optimization Tips

1. **Use appropriate cache TTLs**
   - Vectors: 1 year (immutable)
   - Images: 30 days
   - Videos: 7 days

2. **Minimize invalidations**
   - Batch invalidations
   - Use versioned URLs
   - Invalidate only when necessary

3. **Compress assets**
   - Enable compression
   - Use WebP for images
   - Optimize videos

4. **Choose right storage class**
   - Standard for active assets
   - Intelligent-Tiering for older assets
   - Glacier for archived assets

---

This guide provides complete setup instructions for both AWS CloudFront and Cloudflare CDN solutions.
