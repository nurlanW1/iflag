// Watermarking service for flag assets
// Supports image watermarking using sharp

import sharp from 'sharp';

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color?: string;
  backgroundColor?: string;
}

const DEFAULT_OPTIONS: Required<WatermarkOptions> = {
  text: 'flagswing.com',
  opacity: 0.85,
  fontSize: 14,
  position: 'center',
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.0)',
};

const TILE_SIZE = 180;

/**
 * Creates a single 180×180 SVG tile with diagonal "flagswing.com" text.
 */
function createWatermarkTile(text = 'flagswing.com'): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_SIZE}" height="${TILE_SIZE}">
  <g transform="rotate(-35, ${TILE_SIZE / 2}, ${TILE_SIZE / 2})">
    <text
      x="${TILE_SIZE / 2}" y="${TILE_SIZE / 2}"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="Arial, sans-serif"
      font-size="14"
      font-weight="500"
      letter-spacing="2"
      fill="white"
      fill-opacity="0.85"
      stroke="rgba(0,0,0,0.3)"
      stroke-width="0.4"
      paint-order="stroke fill">${text}</text>
  </g>
</svg>`;
  return Buffer.from(svg);
}

/**
 * Creates a full-size transparent PNG overlay tiled with the watermark.
 */
async function createFullWatermark(
  width: number,
  height: number,
  text?: string,
): Promise<Buffer> {
  const tile = createWatermarkTile(text);
  const cols = Math.ceil(width / TILE_SIZE) + 1;
  const rows = Math.ceil(height / TILE_SIZE) + 1;

  const composites: sharp.OverlayOptions[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      composites.push({
        input: tile,
        left: col * TILE_SIZE,
        top: row * TILE_SIZE,
        blend: 'over',
      });
    }
  }

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

/**
 * Add watermark to image buffer.
 * Signature unchanged — options accepted for compatibility.
 */
export async function addWatermarkToImage(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width ?? 800;
    const height = metadata.height ?? 600;

    const overlay = await createFullWatermark(width, height, opts.text);

    return image
      .composite([{ input: overlay, blend: 'over' }])
      .toBuffer();
  } catch (error) {
    console.error('Watermarking error:', error);
    throw new Error('Failed to add watermark to image');
  }
}

/** Alias for backend upload preview pipeline (same as {@link addWatermarkToImage}). */
export async function addWatermarkImage(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  return addWatermarkToImage(imageBuffer, options);
}

/**
 * Add watermark to image from URL (for server-side processing).
 */
export async function addWatermarkFromUrl(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return await addWatermarkToImage(Buffer.from(arrayBuffer), options);
  } catch (error) {
    console.error('Watermark from URL error:', error);
    throw new Error('Failed to add watermark from URL');
  }
}

/**
 * Check if file is an image that can be watermarked.
 */
export function isImageFile(mimeType: string): boolean {
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/tiff',
    'image/tif',
  ].includes(mimeType.toLowerCase());
}

/**
 * Check if file is a video that can be watermarked.
 */
export function isVideoFile(mimeType: string): boolean {
  return [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
  ].includes(mimeType.toLowerCase());
}

/**
 * Add watermark to video (requires FFmpeg).
 */
export async function addWatermarkToVideo(
  _videoBuffer: Buffer,
  _options: WatermarkOptions = {}
): Promise<Buffer> {
  throw new Error('Video watermarking requires FFmpeg integration');
}

/**
 * Add watermark to SVG string using an inline tiled pattern.
 */
export function addWatermarkToSVG(
  svgContent: string,
  options: WatermarkOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const text = opts.text ?? 'flagswing.com';

  // Parse SVG dimensions
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  const widthMatch = svgContent.match(/\bwidth=["']([^"']+)["']/);
  const heightMatch = svgContent.match(/\bheight=["']([^"']+)["']/);

  let width = 800;
  let height = 600;

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/);
    width = parseFloat(parts[2]) || width;
    height = parseFloat(parts[3]) || height;
  } else if (widthMatch && heightMatch) {
    width = parseFloat(widthMatch[1]) || width;
    height = parseFloat(heightMatch[1]) || height;
  }

  // Build tiled watermark overlay using SVG <pattern>
  const patternId = 'flagswing-wm';
  const overlay = `
  <defs>
    <pattern id="${patternId}" x="0" y="0" width="${TILE_SIZE}" height="${TILE_SIZE}" patternUnits="userSpaceOnUse">
      <g transform="rotate(-35, ${TILE_SIZE / 2}, ${TILE_SIZE / 2})">
        <text
          x="${TILE_SIZE / 2}" y="${TILE_SIZE / 2}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial, sans-serif"
          font-size="14"
          font-weight="500"
          letter-spacing="2"
          fill="white"
          fill-opacity="0.85"
          stroke="rgba(0,0,0,0.3)"
          stroke-width="0.4"
          paint-order="stroke fill">${text}</text>
      </g>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${patternId})" />`;

  return svgContent.replace('</svg>', `${overlay}</svg>`);
}

/**
 * Generate watermark URL parameter (for client-side indication).
 */
export function generateWatermarkUrl(imageUrl: string, watermarkText?: string): string {
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}watermark=true${watermarkText ? `&text=${encodeURIComponent(watermarkText)}` : ''}`;
}
