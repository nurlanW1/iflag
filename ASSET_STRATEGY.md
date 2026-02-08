# Asset Strategy & Media Platform Architecture

## Executive Summary

This document defines the comprehensive asset strategy for Flag Stock Marketplace, covering storage, processing, delivery, and management of vector, raster, video, and preview assets across multiple formats and resolutions.

## 1. VECTOR FORMATS

### 1.1 SVG (Scalable Vector Graphics)

#### Storage Strategy
- **Primary Format**: SVG files stored as-is (text-based, compressible)
- **Location**: `assets/vectors/{asset_id}/original/{filename}.svg`
- **Compression**: Gzip compression at CDN/storage level (typically 70-90% reduction)
- **Versioning**: Store original + optimized versions
- **Metadata**: Extract viewBox, dimensions, embedded fonts, colors

#### Naming Conventions
```
{asset_slug}-{timestamp}-{hash}.svg
Example: usa-flag-1704067200000-a3f2b1c4.svg

Structure:
- Original: {asset_id}/original/{name}.svg
- Optimized: {asset_id}/optimized/{name}.svg (SVGO processed)
- Preview: {asset_id}/preview/{name}.png (rasterized preview)
```

#### Resolution Handling
- **Native**: Infinite scalability (vector)
- **Preview Generation**: Rasterize at multiple sizes:
  - Thumbnail: 300x200px (16:10 aspect ratio)
  - Preview: 800x533px (16:10 aspect ratio)
  - Large Preview: 1920x1280px (for detail view)
- **Rasterization Process**:
  1. Use Sharp or Inkscape CLI to convert SVG → PNG
  2. Maintain aspect ratio from viewBox
  3. Apply background (white/transparent based on asset type)
  4. Generate at multiple DPI (72, 150, 300) for different use cases

#### Preview Generation
```typescript
// SVG Preview Generation Pipeline
1. Load SVG file
2. Validate SVG structure
3. Optimize with SVGO (remove metadata, optimize paths)
4. Rasterize to PNG at target resolution
5. Apply watermark if needed
6. Generate multiple sizes
7. Store previews in CDN
```

**Watermarking SVG**:
- For free/preview: Inline SVG watermark element
- For premium: No watermark, direct SVG delivery
- Watermark as separate SVG layer (non-destructive)

#### Download Permissions
- **Free Users**: Watermarked SVG (with embedded watermark element)
- **Premium Users**: Original, optimized SVG
- **Admin**: All versions + source files

#### Performance & CDN Impact
- **File Size**: 5-50KB typical (after gzip: 2-15KB)
- **CDN Caching**: Aggressive caching (1 year) - immutable assets
- **Delivery**: Direct SVG delivery (no conversion needed)
- **Browser Support**: Native (all modern browsers)
- **Fallback**: PNG preview for older browsers

#### Future Extensibility
- Support for animated SVG (SMIL)
- SVG sprite sheets for icon sets
- SVG optimization levels (lossless, lossy path simplification)
- Multi-color variant support

---

### 1.2 EPS (Encapsulated PostScript)

#### Storage Strategy
- **Primary Format**: Binary EPS files
- **Location**: `assets/vectors/{asset_id}/original/{filename}.eps`
- **Conversion**: Convert to SVG for web delivery (primary) + keep EPS for print
- **Dual Storage**: Store both EPS (original) and converted SVG
- **Metadata Extraction**: Extract bounding box, color mode, embedded fonts

#### Naming Conventions
```
{asset_slug}-{timestamp}-{hash}.eps
Example: usa-flag-1704067200000-b5e8c9d2.eps

Structure:
- Original: {asset_id}/original/{name}.eps
- Converted SVG: {asset_id}/converted/{name}.svg
- Preview: {asset_id}/preview/{name}.png
```

#### Resolution Handling
- **Native**: Vector (infinite scalability)
- **Conversion Process**:
  1. EPS → SVG conversion using Inkscape or Ghostscript
  2. Validate conversion quality
  3. Optimize converted SVG
  4. Generate raster previews from SVG
- **Print Resolution**: EPS files maintain print-ready quality (300+ DPI equivalent)

#### Preview Generation
```typescript
// EPS Preview Generation Pipeline
1. Convert EPS → SVG (using Inkscape CLI or Ghostscript)
2. Validate SVG output
3. Optimize SVG
4. Generate PNG previews from SVG (same as SVG pipeline)
5. Apply watermarks to previews
6. Store all versions
```

**Conversion Tools**:
- **Inkscape CLI**: `inkscape --export-type=svg input.eps`
- **Ghostscript**: `gs -dNOPAUSE -dBATCH -sDEVICE=svg -sOutputFile=output.svg input.eps`
- **Fallback**: Rasterize EPS directly if conversion fails

#### Download Permissions
- **Free Users**: Watermarked PNG preview only
- **Premium Users**: 
  - Converted SVG (web-ready)
  - Original EPS (print-ready)
- **Admin**: All formats + conversion logs

#### Performance & CDN Impact
- **File Size**: 50-500KB typical (EPS), 5-50KB (converted SVG)
- **Processing**: EPS conversion is CPU-intensive (async processing)
- **CDN Strategy**: 
  - Cache converted SVG aggressively
  - Cache previews
  - Original EPS: Lower cache priority (less frequent downloads)
- **Delivery**: Serve SVG for web, EPS for print downloads

#### Future Extensibility
- AI-powered EPS optimization
- Batch conversion processing
- EPS metadata extraction (colors, fonts, layers)
- Support for EPS variants (CMYK, RGB)

---

## 2. RASTER FORMATS

### 2.1 PNG (Portable Network Graphics)

#### Storage Strategy
- **Transparency Support**: Store both transparent and non-transparent versions
- **Location**: `assets/rasters/{asset_id}/original/{filename}.png`
- **Variants**: 
  - Original (full resolution)
  - Transparent version (if applicable)
  - Non-transparent version (white/colored background)
- **Compression**: PNG optimization (pngquant, optipng)
- **Color Depth**: 8-bit (optimized) or 24-bit (high quality)

#### Naming Conventions
```
{asset_slug}-{timestamp}-{hash}-{variant}.png

Variants:
- {name}.png (original, may have transparency)
- {name}-transparent.png (explicitly transparent)
- {name}-opaque.png (white background)
- {name}-{width}x{height}.png (resized versions)

Example:
usa-flag-1704067200000-c1d2e3f4.png (original)
usa-flag-1704067200000-c1d2e3f4-transparent.png
usa-flag-1704067200000-c1d2e3f4-opaque.png
usa-flag-1704067200000-c1d2e3f4-1920x1280.png
```

#### Resolution Handling
- **Original Resolution**: Store as uploaded (typically 1920x1280 to 4096x2731)
- **Standard Resolutions**:
  - Thumbnail: 300x200px
  - Preview: 800x533px
  - Medium: 1920x1280px
  - Large: 3840x2560px
  - Original: As uploaded
- **Aspect Ratio**: Maintain 16:10 for flags (standardized)
- **Resizing**: Use Sharp with Lanczos3 algorithm (high quality)

#### Preview Generation
```typescript
// PNG Preview Generation Pipeline
1. Load original PNG
2. Extract metadata (dimensions, color depth, transparency)
3. Generate multiple sizes (thumbnail, preview, medium)
4. Apply watermark to preview sizes
5. Create transparent and opaque variants
6. Optimize with pngquant (8-bit) or optipng (lossless)
7. Store all variants
```

**Watermarking Strategy**:
- Apply to preview sizes only (not original)
- Maintain transparency in watermarked versions
- Use semi-transparent watermark overlay

#### Download Permissions
- **Free Users**: 
  - Watermarked preview (800x533px)
  - Watermarked thumbnail
- **Premium Users**:
  - All resolutions (original + resized)
  - Transparent and opaque variants
  - No watermarks
- **Admin**: All versions + processing logs

#### Performance & CDN Impact
- **File Sizes**:
  - Thumbnail: 20-50KB
  - Preview: 100-300KB
  - Medium: 500KB-2MB
  - Large: 2-8MB
  - Original: 5-20MB
- **CDN Strategy**:
  - Cache all sizes aggressively (1 year)
  - Use WebP variants for modern browsers (automatic conversion)
  - Lazy load high-res versions
- **Optimization**: 
  - Serve WebP when supported (30-50% smaller)
  - Progressive JPEG for large images
  - Responsive images with srcset

#### Future Extensibility
- APNG support for animated PNGs
- Multi-resolution variants (1x, 2x, 3x for Retina)
- Color profile support (sRGB, Adobe RGB)
- HDR PNG support

---

### 2.2 JPG (JPEG)

#### Storage Strategy
- **Primary Format**: JPEG files (lossy compression)
- **Location**: `assets/rasters/{asset_id}/original/{filename}.jpg`
- **Quality Levels**: Store multiple quality versions
- **Color Space**: sRGB (web standard)
- **Progressive JPEG**: Enable for better perceived performance

#### Naming Conventions
```
{asset_slug}-{timestamp}-{hash}-q{quality}.jpg

Quality levels:
- {name}-q90.jpg (high quality, ~2-5MB)
- {name}-q85.jpg (standard, ~1-3MB)
- {name}-q75.jpg (optimized, ~500KB-1.5MB)
- {name}-{width}x{height}-q85.jpg (resized)

Example:
usa-flag-1704067200000-d4e5f6a7-q90.jpg
usa-flag-1704067200000-d4e5f6a7-1920x1280-q85.jpg
```

#### Resolution Handling
- **Original Resolution**: As uploaded (typically 1920x1280 to 4096x2731)
- **Standard Resolutions**: Same as PNG
- **Quality Settings**:
  - Original: Q90 (high quality)
  - Preview: Q85 (good quality, smaller size)
  - Thumbnail: Q75 (acceptable quality, small size)
- **Resizing**: Sharp with high-quality Lanczos3

#### Preview Generation
```typescript
// JPEG Preview Generation Pipeline
1. Load original JPEG
2. Extract metadata (EXIF data, dimensions)
3. Strip EXIF (privacy + file size)
4. Generate multiple sizes and quality levels
5. Apply watermark to preview sizes
6. Optimize with mozjpeg or libjpeg-turbo
7. Create progressive JPEGs
8. Store all variants
```

**Watermarking**:
- Apply to preview sizes only
- Use semi-transparent overlay
- Maintain JPEG quality after watermarking

#### Download Permissions
- **Free Users**: Watermarked preview (800x533px, Q85)
- **Premium Users**:
  - All resolutions
  - All quality levels
  - Original high-quality version
- **Admin**: All versions + EXIF data

#### Performance & CDN Impact
- **File Sizes**:
  - Thumbnail: 15-40KB
  - Preview: 80-200KB
  - Medium: 400KB-1.5MB
  - Large: 1.5-6MB
  - Original: 3-15MB
- **CDN Strategy**:
  - Aggressive caching (1 year)
  - Serve WebP when supported (automatic)
  - Progressive JPEG for better perceived load
- **Optimization**:
  - mozjpeg for better compression
  - Responsive images with srcset
  - Lazy loading

#### Future Extensibility
- JPEG XL support (next-gen format)
- HDR JPEG support
- Multi-quality adaptive streaming
- Smart cropping for thumbnails

---

### 2.3 TIFF (Tagged Image File Format)

#### Storage Strategy
- **Primary Format**: TIFF files (lossless, print-ready)
- **Location**: `assets/rasters/{asset_id}/original/{filename}.tiff`
- **Compression**: LZW or ZIP compression (lossless)
- **Color Modes**: RGB, CMYK support
- **Bit Depth**: 8-bit, 16-bit per channel
- **Dual Storage**: Store TIFF + converted formats for web

#### Naming Conventions
```
{asset_slug}-{timestamp}-{hash}-{colormode}.tiff

Color modes:
- {name}-rgb.tiff (RGB, web)
- {name}-cmyk.tiff (CMYK, print)
- {name}-rgb-16bit.tiff (16-bit per channel)

Example:
usa-flag-1704067200000-e5f6a7b8-rgb.tiff
usa-flag-1704067200000-e5f6a7b8-cmyk.tiff
```

#### Resolution Handling
- **Original Resolution**: High-res print quality (300+ DPI)
- **Typical Sizes**: 6000x4000px to 12000x8000px
- **DPI Handling**: Store DPI metadata, convert to pixel dimensions
- **Web Conversion**: Convert to PNG/JPEG for web delivery
- **Print Delivery**: Serve original TIFF for print downloads

#### Preview Generation
```typescript
// TIFF Preview Generation Pipeline
1. Load TIFF file (may be very large, use streaming)
2. Extract metadata (dimensions, DPI, color mode, bit depth)
3. Convert color mode if needed (CMYK → RGB for web)
4. Downscale for web previews (maintain aspect ratio)
5. Generate multiple sizes (thumbnail, preview, medium)
6. Apply watermark to preview sizes
7. Convert to PNG (lossless) or JPEG (lossy) for web
8. Store original TIFF + web variants
```

**Processing Considerations**:
- TIFF files can be very large (50-500MB)
- Use streaming processing for large files
- Consider async processing queue
- Cache converted web versions aggressively

#### Download Permissions
- **Free Users**: 
  - Watermarked preview (800x533px, converted to PNG/JPEG)
  - No TIFF access
- **Premium Users**:
  - Web versions (PNG/JPEG at various sizes)
  - Original TIFF (high-res, print-ready)
  - RGB and CMYK variants if available
- **Admin**: All formats + processing metadata

#### Performance & CDN Impact
- **File Sizes**:
  - Original TIFF: 50-500MB (very large)
  - Web preview: 100-300KB (converted)
  - Medium web: 500KB-2MB
- **CDN Strategy**:
  - Cache web versions aggressively
  - Original TIFF: Lower cache priority (large, infrequent)
  - Consider separate storage tier for TIFF (cheaper, slower)
- **Processing**: 
  - Async processing for TIFF conversion
  - Queue system for large file processing
  - Progress tracking for conversions

#### Future Extensibility
- GeoTIFF support (geographic metadata)
- Multi-page TIFF support
- TIFF compression optimization
- Cloud processing for large files (AWS Lambda, Google Cloud Functions)

---

## 3. VIDEO FORMATS

### 3.1 MP4 (H.264/H.265)

#### Storage Strategy
- **Primary Format**: MP4 with H.264 codec (universal compatibility)
- **Location**: `assets/videos/{asset_id}/original/{filename}.mp4`
- **Encoding Profiles**: Multiple quality/bitrate versions
- **Container**: MP4 (ISO Base Media)
- **Audio**: AAC or no audio (for flag animations)

#### Naming Conventions
```
{asset_slug}-{timestamp}-{hash}-{profile}.mp4

Profiles:
- {name}-4k.mp4 (3840x2160, high bitrate)
- {name}-1080p.mp4 (1920x1080, standard)
- {name}-720p.mp4 (1280x720, web optimized)
- {name}-480p.mp4 (854x480, mobile)

Example:
usa-flag-waving-1704067200000-f6a7b8c9-1080p.mp4
usa-flag-waving-1704067200000-f6a7b8c9-720p.mp4
```

#### Resolution Handling
- **Original Resolution**: As uploaded (typically 1080p or 4K)
- **Standard Profiles**:
  - 4K: 3840x2160 (high quality, large file)
  - 1080p: 1920x1080 (standard, balanced)
  - 720p: 1280x720 (web optimized)
  - 480p: 854x480 (mobile, fast loading)
- **Bitrate Settings**:
  - 4K: 20-50 Mbps
  - 1080p: 5-10 Mbps
  - 720p: 2-5 Mbps
  - 480p: 1-2 Mbps
- **Aspect Ratio**: 16:9 standard, maintain original if different

#### Preview Generation
```typescript
// MP4 Preview Generation Pipeline
1. Load original MP4
2. Extract metadata (duration, resolution, codec, bitrate)
3. Generate multiple quality profiles (4K, 1080p, 720p, 480p)
4. Create preview thumbnail (first frame or custom frame)
5. Generate preview video (short clip, 5-10 seconds)
6. Apply watermark to preview video
7. Create poster image (first frame, high quality)
8. Store all versions
```

**Watermarking Video**:
- Use FFmpeg to overlay watermark
- Burn watermark into video (not separate overlay)
- Apply to preview versions only
- Maintain video quality after watermarking

#### Download Permissions
- **Free Users**: 
  - Watermarked preview video (720p, 5-10 second clip)
  - Watermarked poster image
- **Premium Users**:
  - All quality profiles (4K, 1080p, 720p, 480p)
  - Full-length video
  - No watermarks
- **Admin**: All versions + encoding logs

#### Performance & CDN Impact
- **File Sizes**:
  - 480p: 5-20MB (1 minute)
  - 720p: 15-50MB (1 minute)
  - 1080p: 40-150MB (1 minute)
  - 4K: 150-500MB (1 minute)
- **CDN Strategy**:
  - Cache all profiles aggressively
  - Use HTTP range requests for streaming
  - Consider video CDN (Cloudflare Stream, AWS MediaStore)
  - Adaptive bitrate streaming (HLS/DASH) for future
- **Delivery**:
  - Progressive download (MP4)
  - Streaming support (HLS/DASH ready)
  - Lazy load high-res versions

#### Future Extensibility
- H.265/HEVC support (better compression)
- AV1 codec support (next-gen, royalty-free)
- Adaptive bitrate streaming (HLS, DASH)
- 360-degree video support
- VR video formats

---

### 3.2 WEBM (VP9/AV1)

#### Storage Strategy
- **Primary Format**: WEBM with VP9 or AV1 codec
- **Location**: `assets/videos/{asset_id}/original/{filename}.webm`
- **Purpose**: Modern browser support, better compression than MP4
- **Dual Format**: Store both MP4 and WEBM for compatibility

#### Naming Conventions
```
{asset_slug}-{timestamp}-{hash}-{codec}-{profile}.webm

Codecs:
- {name}-vp9-1080p.webm
- {name}-av1-1080p.webm

Example:
usa-flag-waving-1704067200000-a7b8c9d0-vp9-1080p.webm
```

#### Resolution Handling
- **Same as MP4**: Multiple quality profiles
- **Codec Selection**:
  - VP9: Better compression than H.264, good browser support
  - AV1: Best compression, newer browsers
- **Encoding**: Use FFmpeg with VP9/AV1 encoders

#### Preview Generation
```typescript
// WEBM Preview Generation Pipeline
1. Load original WEBM or convert from MP4
2. Generate multiple quality profiles
3. Create preview clip (watermarked)
4. Generate poster image
5. Store alongside MP4 versions
```

#### Download Permissions
- **Free Users**: Watermarked preview (WEBM or MP4)
- **Premium Users**: All formats and qualities
- **Admin**: All versions

#### Performance & CDN Impact
- **File Sizes**: 20-30% smaller than equivalent MP4
- **Browser Support**: Modern browsers (Chrome, Firefox, Edge)
- **Fallback**: Serve MP4 for older browsers
- **CDN Strategy**: Same as MP4, with format detection

#### Future Extensibility
- AV1 adoption as it becomes standard
- Opus audio codec optimization
- WebM for animated flags (GIF replacement)

---

### 3.3 Looping Animated Flags

#### Storage Strategy
- **Primary Format**: MP4 or WEBM with seamless loop
- **Location**: `assets/videos/{asset_id}/animated/{filename}.mp4`
- **Loop Metadata**: Store loop points, duration
- **Optimization**: Optimize for seamless looping

#### Naming Conventions
```
{asset_slug}-animated-{timestamp}-{hash}-{profile}.mp4

Example:
usa-flag-waving-animated-1704067200000-b8c9d0e1-1080p.mp4
```

#### Resolution Handling
- **Standard Resolutions**: 1080p, 720p, 480p
- **Loop Duration**: Typically 3-10 seconds
- **Seamless Loop**: Ensure first and last frames match

#### Preview Generation
```typescript
// Animated Flag Preview Pipeline
1. Load animated video
2. Verify seamless loop
3. Generate preview (watermarked, shorter loop)
4. Create animated GIF preview (optional, for compatibility)
5. Generate static poster
6. Store all versions
```

**GIF Preview Option**:
- Convert to animated GIF for preview (smaller, universal)
- Limit colors (256) for file size
- Short duration (2-3 seconds)
- Watermarked

#### Download Permissions
- **Free Users**: 
  - Watermarked preview (short loop)
  - Animated GIF preview (if available)
- **Premium Users**:
  - Full animated video (all qualities)
  - Seamless loop version
- **Admin**: All versions

#### Performance & CDN Impact
- **File Sizes**: Smaller than full videos (short loops)
- **CDN Strategy**: 
  - Cache aggressively
  - Consider GIF previews for instant preview
  - Lazy load video on hover/click
- **Delivery**: 
  - Autoplay preview (muted, looped)
  - Full video on download

#### Future Extensibility
- Lottie animations (JSON-based, smaller)
- CSS animations for simple flags
- WebP animated format support
- Interactive flag animations

---

## 4. PREVIEW FORMATS

### 4.1 Watermarked Images

#### Storage Strategy
- **Location**: `assets/previews/{asset_id}/watermarked/{filename}.{ext}`
- **Format**: Same as original (PNG, JPG) or WebP
- **Watermark Type**: 
  - Text overlay (site name)
  - Logo overlay
  - Pattern overlay (repeating)
- **Non-Destructive**: Generate on-demand or pre-generate

#### Naming Conventions
```
{asset_slug}-preview-watermarked-{size}.{ext}

Sizes:
- {name}-preview-watermarked-300x200.jpg
- {name}-preview-watermarked-800x533.jpg

Example:
usa-flag-preview-watermarked-800x533.jpg
```

#### Resolution Handling
- **Standard Sizes**: 300x200, 800x533, 1920x1280
- **Watermark Size**: Scale with image size
- **Quality**: Slightly lower than original (Q85 for JPEG)

#### Generation Strategy
```typescript
// Watermark Generation Options

Option 1: Pre-generate (Recommended)
- Generate watermarked previews on upload
- Store in CDN
- Fast delivery, higher storage cost

Option 2: On-demand (Alternative)
- Generate on first request
- Cache result
- Lower storage, higher compute

Implementation:
1. Load original or preview size
2. Apply watermark overlay
3. Optimize output
4. Cache result
```

#### Download Permissions
- **Free Users**: Only watermarked previews
- **Premium Users**: No watermarks
- **Admin**: All versions

#### Performance & CDN Impact
- **File Size**: Slightly larger than non-watermarked (5-10%)
- **CDN Strategy**: Cache aggressively (1 year)
- **Generation**: Pre-generate for performance

#### Future Extensibility
- Custom watermark per user (for tracking)
- Dynamic watermark positioning
- Watermark intensity adjustment
- Branded watermarks for partners

---

### 4.2 Low-Resolution Previews

#### Storage Strategy
- **Location**: `assets/previews/{asset_id}/lowres/{filename}.{ext}`
- **Format**: WebP (preferred) or JPEG
- **Purpose**: Fast loading, bandwidth saving
- **Quality**: Lower quality, smaller file size

#### Naming Conventions
```
{asset_slug}-preview-lowres-{size}.webp

Sizes:
- {name}-preview-lowres-300x200.webp
- {name}-preview-lowres-800x533.webp

Example:
usa-flag-preview-lowres-800x533.webp
```

#### Resolution Handling
- **Standard Sizes**: 300x200, 800x533
- **Quality**: Q75 for JPEG, 80% for WebP
- **Format Priority**: WebP > JPEG > PNG

#### Generation Strategy
```typescript
// Low-Res Preview Pipeline
1. Load original
2. Downscale to target size
3. Reduce quality
4. Convert to WebP (if supported)
5. Optimize
6. Store
```

#### Download Permissions
- **All Users**: Low-res previews for browsing
- **Premium Users**: Can download high-res
- **Free Users**: Limited to low-res

#### Performance & CDN Impact
- **File Size**: 20-100KB typical
- **CDN Strategy**: Very aggressive caching
- **Delivery**: Serve WebP when supported, JPEG fallback

#### Future Extensibility
- Progressive JPEG for better perceived performance
- Blur-up technique (blurred placeholder → sharp)
- Lazy loading with intersection observer

---

### 4.3 Video Previews with Watermark

#### Storage Strategy
- **Location**: `assets/previews/{asset_id}/video-preview/{filename}.mp4`
- **Format**: MP4 (H.264) or WEBM
- **Duration**: 5-10 seconds (short preview)
- **Resolution**: 720p or 480p (lower than full video)

#### Naming Conventions
```
{asset_slug}-video-preview-watermarked-{profile}.mp4

Example:
usa-flag-waving-video-preview-watermarked-720p.mp4
```

#### Resolution Handling
- **Standard**: 720p, 480p
- **Duration**: 5-10 seconds
- **Bitrate**: Lower than full video (2-3 Mbps)

#### Generation Strategy
```typescript
// Video Preview Pipeline
1. Load original video
2. Extract preview segment (first 5-10 seconds)
3. Downscale to preview resolution
4. Apply watermark overlay
5. Re-encode with lower bitrate
6. Store preview
```

#### Download Permissions
- **Free Users**: Watermarked video preview only
- **Premium Users**: Full video access
- **Admin**: All versions

#### Performance & CDN Impact
- **File Size**: 2-10MB (short duration, lower quality)
- **CDN Strategy**: Cache aggressively
- **Delivery**: Autoplay preview, full video on download

#### Future Extensibility
- Thumbnail sprites for video scrubbing
- Multiple preview segments
- Interactive preview player

---

## 5. STORAGE ARCHITECTURE

### 5.1 Storage Hierarchy

```
assets/
├── vectors/
│   ├── {asset_id}/
│   │   ├── original/
│   │   │   ├── {name}.svg
│   │   │   └── {name}.eps
│   │   ├── optimized/
│   │   │   └── {name}.svg
│   │   ├── converted/
│   │   │   └── {name}.svg (from EPS)
│   │   └── preview/
│   │       └── {name}.png
│
├── rasters/
│   ├── {asset_id}/
│   │   ├── original/
│   │   │   ├── {name}.png
│   │   │   ├── {name}.jpg
│   │   │   └── {name}.tiff
│   │   ├── variants/
│   │   │   ├── {name}-transparent.png
│   │   │   └── {name}-opaque.png
│   │   └── resized/
│   │       ├── {name}-1920x1280.jpg
│   │       └── {name}-3840x2560.jpg
│
├── videos/
│   ├── {asset_id}/
│   │   ├── original/
│   │   │   └── {name}.mp4
│   │   ├── profiles/
│   │   │   ├── {name}-1080p.mp4
│   │   │   ├── {name}-720p.mp4
│   │   │   └── {name}-480p.mp4
│   │   └── animated/
│   │       └── {name}-animated.mp4
│
└── previews/
    ├── {asset_id}/
    │   ├── watermarked/
    │   │   └── {name}-watermarked-800x533.jpg
    │   ├── lowres/
    │   │   └── {name}-lowres-800x533.webp
    │   └── video-preview/
    │       └── {name}-preview-720p.mp4
```

### 5.2 Storage Providers

#### Local Filesystem (Development)
- **Path**: `./uploads/assets/`
- **Use Case**: Development, testing
- **Limitations**: Not scalable, no CDN

#### S3-Compatible (Production)
- **Providers**: AWS S3, DigitalOcean Spaces, Cloudflare R2
- **Structure**: Same hierarchy in bucket
- **Benefits**: Scalable, CDN-ready, versioning

#### CDN Integration
- **Primary CDN**: Cloudflare, CloudFront, or similar
- **Caching**: Aggressive caching for immutable assets
- **Purge**: On asset update/delete

### 5.3 Storage Optimization

#### Compression
- **Gzip/Brotli**: For text-based formats (SVG, JSON)
- **Image Optimization**: pngquant, mozjpeg, optipng
- **Video Optimization**: FFmpeg with optimal settings

#### Lifecycle Policies
- **Hot Storage**: Recent assets, frequently accessed
- **Warm Storage**: Older assets, less frequent access
- **Cold Storage**: Archived assets, rare access (Glacier, etc.)

#### Backup Strategy
- **Versioning**: Enable S3 versioning
- **Backups**: Regular backups to separate region
- **Disaster Recovery**: Multi-region replication

---

## 6. NAMING CONVENTIONS SUMMARY

### Universal Pattern
```
{asset_slug}-{timestamp}-{hash}-{variant}-{size}.{ext}
```

### Components
- **asset_slug**: URL-friendly asset identifier
- **timestamp**: Unix timestamp (milliseconds)
- **hash**: Short hash (8 chars) for uniqueness
- **variant**: Format-specific variant (transparent, quality, profile)
- **size**: Dimensions (width x height) if applicable
- **ext**: File extension

### Examples
```
usa-flag-1704067200000-a3f2b1c4.svg
usa-flag-1704067200000-b5e8c9d2-rgb.tiff
usa-flag-waving-1704067200000-c1d2e3f4-1080p.mp4
usa-flag-1704067200000-d4e5f6a7-watermarked-800x533.jpg
```

---

## 7. PERFORMANCE OPTIMIZATION

### 7.1 Image Optimization
- **Format Selection**: WebP when supported, fallback to JPEG/PNG
- **Responsive Images**: srcset for multiple sizes
- **Lazy Loading**: Intersection Observer API
- **Progressive Loading**: Progressive JPEG, blur-up technique

### 7.2 Video Optimization
- **Adaptive Bitrate**: HLS/DASH for streaming
- **Thumbnail Sprites**: For video scrubbing
- **Poster Images**: High-quality first frame
- **Lazy Loading**: Load on interaction

### 7.3 CDN Strategy
- **Edge Caching**: Cache at CDN edge locations
- **Cache Headers**: Long TTL for immutable assets
- **Purge API**: Invalidate on updates
- **Compression**: Gzip/Brotli at CDN level

### 7.4 Processing Pipeline
- **Async Processing**: Queue system for heavy operations
- **Priority Queue**: Process previews first, originals later
- **Progress Tracking**: Show processing status
- **Error Handling**: Retry failed processing

---

## 8. FUTURE EXTENSIBILITY

### 8.1 Format Support
- **New Formats**: Plugin-based format handler system
- **Codec Support**: Easy addition of new codecs
- **Metadata Extraction**: Extensible metadata parsers

### 8.2 Processing Pipeline
- **Microservices**: Separate services for different formats
- **Serverless**: Lambda functions for processing
- **GPU Processing**: GPU acceleration for video/image processing

### 8.3 Storage
- **Multi-Cloud**: Support multiple storage providers
- **Hybrid**: Hot storage (S3) + Cold storage (Glacier)
- **Replication**: Multi-region replication

### 8.4 Delivery
- **Adaptive Streaming**: HLS, DASH support
- **Image CDN**: Cloudinary, ImageKit integration
- **Video CDN**: Specialized video delivery

---

## 9. IMPLEMENTATION PRIORITIES

### Phase 1: Core Formats
1. PNG (transparent & opaque)
2. JPG (multiple qualities)
3. SVG (with previews)
4. MP4 (1080p, 720p)

### Phase 2: Extended Formats
1. EPS (with conversion)
2. TIFF (with web conversion)
3. WEBM (VP9)
4. Animated flags

### Phase 3: Advanced Features
1. Watermarking system
2. Preview generation
3. CDN integration
4. Processing queue

### Phase 4: Optimization
1. WebP support
2. Adaptive streaming
3. Advanced caching
4. Performance monitoring

---

## 10. METRICS & MONITORING

### Key Metrics
- **Storage Usage**: By format, by size tier
- **Processing Time**: Average processing time per format
- **CDN Hit Rate**: Cache hit percentage
- **Download Patterns**: Most downloaded formats/sizes
- **Bandwidth Usage**: By format, by region

### Monitoring
- **Processing Queue**: Queue length, processing time
- **Storage Health**: Available space, growth rate
- **CDN Performance**: Response times, error rates
- **User Experience**: Load times, download speeds

---

This comprehensive asset strategy provides a solid foundation for a scalable, performant media platform that can handle current needs and future growth.
