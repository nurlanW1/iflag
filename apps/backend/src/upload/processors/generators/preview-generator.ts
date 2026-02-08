// Preview Generator - Generates previews and thumbnails

import sharp from 'sharp';
import { addWatermarkImage } from 'watermarking';

export interface Preview {
  type: string;
  buffer: Buffer;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
}

// Generate previews for file
export async function generatePreviews(
  file_buffer: Buffer,
  format: string,
  metadata: Record<string, any>
): Promise<Preview[]> {
  const previews: Preview[] = [];

  if (format === 'svg' || format === 'eps') {
    // Rasterize vector to generate previews
    previews.push(...await generateVectorPreviews(file_buffer, format, metadata));
  } else if (format === 'png' || format === 'jpg' || format === 'jpeg') {
    // Generate image previews
    previews.push(...await generateImagePreviews(file_buffer, metadata));
  } else if (format === 'mp4' || format === 'webm') {
    // Generate video previews (thumbnail + preview clip)
    previews.push(...await generateVideoPreviews(file_buffer, format));
  }

  return previews;
}

// Generate previews from vector files
async function generateVectorPreviews(
  buffer: Buffer,
  format: string,
  metadata: Record<string, any>
): Promise<Preview[]> {
  const previews: Preview[] = [];

  // Rasterize to PNG at different sizes
  const sizes = [
    { type: 'thumbnail', width: 300, height: 200 },
    { type: 'preview', width: 800, height: 533 },
    { type: 'large_preview', width: 1920, height: 1280 },
  ];

  for (const size of sizes) {
    try {
      let image = sharp(buffer, { density: 300 }); // High DPI for vectors

      // Resize maintaining aspect ratio
      image = image.resize(size.width, size.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
      });

      // Convert to PNG
      const preview_buffer = await image.png().toBuffer();

      previews.push({
        type: size.type,
        buffer: preview_buffer,
        width: size.width,
        height: size.height,
        format: 'png',
      });
    } catch (error) {
      console.error(`Failed to generate ${size.type} preview:`, error);
    }
  }

  return previews;
}

// Generate previews from raster images
async function generateImagePreviews(
  buffer: Buffer,
  metadata: Record<string, any>
): Promise<Preview[]> {
  const previews: Preview[] = [];

  const sizes = [
    { type: 'thumbnail', width: 300, height: 200 },
    { type: 'preview', width: 800, height: 533 },
    { type: 'large_preview', width: 1920, height: 1280 },
  ];

  for (const size of sizes) {
    try {
      let image = sharp(buffer);

      // Resize
      image = image.resize(size.width, size.height, {
        fit: 'contain',
        withoutEnlargement: true,
      });

      // Convert to WebP for better compression
      const preview_buffer = await image.webp({ quality: 85 }).toBuffer();

      // Get actual dimensions after resize
      const preview_metadata = await sharp(preview_buffer).metadata();

      previews.push({
        type: size.type,
        buffer: preview_buffer,
        width: preview_metadata.width || size.width,
        height: preview_metadata.height || size.height,
        format: 'webp',
      });
    } catch (error) {
      console.error(`Failed to generate ${size.type} preview:`, error);
    }
  }

  return previews;
}

// Generate previews from video files
async function generateVideoPreviews(
  buffer: Buffer,
  format: string
): Promise<Preview[]> {
  const previews: Preview[] = [];

  // For video, we'd use FFmpeg to:
  // 1. Extract first frame as thumbnail
  // 2. Generate preview clip (5-10 seconds)
  // 3. Apply watermark to preview

  // This is a placeholder - would need FFmpeg integration
  // For now, return empty array (previews generated separately)

  return previews;
}

// Generate watermarked preview
export async function generateWatermarkedPreview(
  original_buffer: Buffer,
  format: string
): Promise<Buffer> {
  // Rasterize if vector
  let image_buffer = original_buffer;
  
  if (format === 'svg' || format === 'eps') {
    const sharp = (await import('sharp')).default;
    image_buffer = await sharp(original_buffer, { density: 300 })
      .resize(800, 533, { fit: 'contain' })
      .png()
      .toBuffer();
  }

  // Apply watermark
  return await addWatermarkImage(image_buffer, {
    text: 'FLAGSTOCK.COM',
    opacity: 0.7,
    position: 'center',
  });
}
