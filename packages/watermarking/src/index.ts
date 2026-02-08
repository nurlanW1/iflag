// Watermarking service for flag assets
// Supports image watermarking using sharp

import sharp from 'sharp';
import { Readable } from 'stream';

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color?: string;
  backgroundColor?: string;
}

const DEFAULT_OPTIONS: Required<WatermarkOptions> = {
  text: 'FLAGSTOCK.COM',
  opacity: 0.7,
  fontSize: 48,
  position: 'center',
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
};

/**
 * Add watermark to image buffer
 */
export async function addWatermarkToImage(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Create watermark text SVG
    const svgWatermark = createWatermarkSVG(width, height, opts);

    // Composite watermark onto image
    const watermarked = await image
      .composite([
        {
          input: Buffer.from(svgWatermark),
          blend: 'over',
        },
      ])
      .toBuffer();

    return watermarked;
  } catch (error) {
    console.error('Watermarking error:', error);
    throw new Error('Failed to add watermark to image');
  }
}

/**
 * Create SVG watermark overlay
 */
function createWatermarkSVG(
  width: number,
  height: number,
  options: Required<WatermarkOptions>
): string {
  const { text, opacity, fontSize, position, color, backgroundColor } = options;

  // Calculate position
  let x = width / 2;
  let y = height / 2;
  let textAnchor = 'middle';

  switch (position) {
    case 'top-left':
      x = fontSize;
      y = fontSize + 20;
      textAnchor = 'start';
      break;
    case 'top-right':
      x = width - fontSize;
      y = fontSize + 20;
      textAnchor = 'end';
      break;
    case 'bottom-left':
      x = fontSize;
      y = height - fontSize;
      textAnchor = 'start';
      break;
    case 'bottom-right':
      x = width - fontSize;
      y = height - fontSize;
      textAnchor = 'end';
      break;
    case 'center':
    default:
      x = width / 2;
      y = height / 2;
      textAnchor = 'middle';
      break;
  }

  // Create repeating watermark pattern for better coverage
  const pattern = Array(9)
    .fill(null)
    .map((_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const offsetX = (width / 3) * col;
      const offsetY = (height / 3) * row;
      return `<text x="${offsetX + x}" y="${offsetY + y}" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              font-weight="bold"
              fill="${color}" 
              fill-opacity="${opacity}"
              text-anchor="${textAnchor}"
              transform="rotate(-45 ${offsetX + x} ${offsetY + y})">${text}</text>`;
    })
    .join('\n');

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .watermark-text {
            font-family: Arial, sans-serif;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          }
        </style>
      </defs>
      ${pattern}
    </svg>
  `;
}

/**
 * Add watermark to image from URL (for server-side processing)
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
    const buffer = Buffer.from(arrayBuffer);

    return await addWatermarkToImage(buffer, options);
  } catch (error) {
    console.error('Watermark from URL error:', error);
    throw new Error('Failed to add watermark from URL');
  }
}

/**
 * Check if file is an image that can be watermarked
 */
export function isImageFile(mimeType: string): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/tiff', 'image/tif'].includes(
    mimeType.toLowerCase()
  );
}

/**
 * Check if file is a video that can be watermarked
 */
export function isVideoFile(mimeType: string): boolean {
  return ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'].includes(
    mimeType.toLowerCase()
  );
}

/**
 * Add watermark to video (requires FFmpeg)
 * Note: This is a placeholder - requires FFmpeg installation
 */
export async function addWatermarkToVideo(
  videoBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  // This would require FFmpeg integration
  // For now, return original buffer
  // In production, use FFmpeg to overlay watermark
  throw new Error('Video watermarking requires FFmpeg integration');
}

/**
 * Add watermark to SVG (inline SVG element)
 */
export function addWatermarkToSVG(
  svgContent: string,
  options: WatermarkOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Parse SVG to get dimensions
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  const widthMatch = svgContent.match(/width=["']([^"']+)["']/);
  const heightMatch = svgContent.match(/height=["']([^"']+)["']/);
  
  let width = 800;
  let height = 600;
  
  if (viewBoxMatch) {
    const [, , , w, h] = viewBoxMatch[1].split(/\s+/);
    width = parseFloat(w) || width;
    height = parseFloat(h) || height;
  } else if (widthMatch && heightMatch) {
    width = parseFloat(widthMatch[1]) || width;
    height = parseFloat(heightMatch[1]) || height;
  }
  
  // Create watermark SVG element
  const watermarkSvg = createWatermarkSVG(width, height, opts);
  
  // Insert watermark before closing </svg> tag
  const svgWithWatermark = svgContent.replace(
    '</svg>',
    `${watermarkSvg}</svg>`
  );
  
  return svgWithWatermark;
}

/**
 * Generate watermark URL parameter (for client-side indication)
 */
export function generateWatermarkUrl(imageUrl: string, watermarkText?: string): string {
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}watermark=true${watermarkText ? `&text=${encodeURIComponent(watermarkText)}` : ''}`;
}
