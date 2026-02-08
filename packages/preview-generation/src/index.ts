// Preview generation service
// Generates thumbnails and optimized previews for assets

import sharp from 'sharp';
import { Readable } from 'stream';

export interface PreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

const DEFAULT_OPTIONS: Required<PreviewOptions> = {
  width: 800,
  height: 600,
  quality: 85,
  format: 'jpeg',
  fit: 'contain',
};

/**
 * Generate thumbnail from image buffer
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  options: PreviewOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  opts.width = 300; // Thumbnails are smaller
  opts.height = 200;

  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(opts.width, opts.height, {
        fit: opts.fit,
        withoutEnlargement: true,
      })
      .toFormat(opts.format, { quality: opts.quality })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Generate preview from image buffer
 */
export async function generatePreview(
  imageBuffer: Buffer,
  options: PreviewOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const preview = await sharp(imageBuffer)
      .resize(opts.width, opts.height, {
        fit: opts.fit,
        withoutEnlargement: true,
      })
      .toFormat(opts.format, { quality: opts.quality })
      .toBuffer();

    return preview;
  } catch (error) {
    console.error('Preview generation error:', error);
    throw new Error('Failed to generate preview');
  }
}

/**
 * Generate preview from URL
 */
export async function generatePreviewFromUrl(
  imageUrl: string,
  options: PreviewOptions = {}
): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await generatePreview(buffer, options);
  } catch (error) {
    console.error('Preview from URL error:', error);
    throw new Error('Failed to generate preview from URL');
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: imageBuffer.length,
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    throw new Error('Failed to extract image metadata');
  }
}

/**
 * Check if file is an image that can be processed
 */
export function isImageFile(mimeType: string): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'].includes(
    mimeType.toLowerCase()
  );
}

/**
 * Generate multiple sizes for responsive images
 */
export async function generateResponsivePreviews(
  imageBuffer: Buffer,
  sizes: Array<{ width: number; height: number }> = [
    { width: 300, height: 200 },
    { width: 600, height: 400 },
    { width: 1200, height: 800 },
  ]
): Promise<Array<{ width: number; height: number; buffer: Buffer }>> {
  const previews = await Promise.all(
    sizes.map(async (size) => {
      const buffer = await generatePreview(imageBuffer, {
        width: size.width,
        height: size.height,
        format: 'webp',
      });
      return { ...size, buffer };
    })
  );

  return previews;
}
