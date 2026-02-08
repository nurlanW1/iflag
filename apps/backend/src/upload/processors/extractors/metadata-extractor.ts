// Metadata Extractor - Extracts metadata from files

export async function extractMetadata(
  file_buffer: Buffer,
  format: string,
  mime_type: string
): Promise<Record<string, any>> {
  const metadata: Record<string, any> = {
    format,
    mime_type,
    file_size: file_buffer.length,
  };

  if (mime_type.startsWith('image/')) {
    return await extractImageMetadata(file_buffer, format);
  } else if (mime_type.startsWith('video/')) {
    return await extractVideoMetadata(file_buffer, format);
  } else if (format === 'svg' || format === 'eps') {
    return await extractVectorMetadata(file_buffer, format);
  }

  return metadata;
}

// Extract image metadata
async function extractImageMetadata(
  buffer: Buffer,
  format: string
): Promise<Record<string, any>> {
  const sharp = (await import('sharp')).default;
  
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    return {
      width: metadata.width || null,
      height: metadata.height || null,
      format: metadata.format,
      has_alpha: metadata.hasAlpha || false,
      color_mode: metadata.space || 'rgb',
      dpi: metadata.density || null,
      orientation: metadata.orientation || null,
      color_profile: metadata.icc || null,
    };
  } catch (error: any) {
    console.error('Image metadata extraction error:', error);
    return {};
  }
}

// Extract video metadata
async function extractVideoMetadata(
  buffer: Buffer,
  format: string
): Promise<Record<string, any>> {
  // For video, we need to use FFprobe or similar
  // This is a placeholder - would need actual FFprobe integration
  
  return {
    type: 'video',
    format,
    // Duration, bitrate, codec would be extracted here
  };
}

// Extract vector metadata
async function extractVectorMetadata(
  buffer: Buffer,
  format: string
): Promise<Record<string, any>> {
  if (format === 'svg') {
    const content = buffer.toString('utf8');
    
    // Extract viewBox
    const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/);
    let width: number | null = null;
    let height: number | null = null;
    
    if (viewBoxMatch) {
      const [, , , w, h] = viewBoxMatch[1].split(/\s+/);
      width = parseFloat(w) || null;
      height = parseFloat(h) || null;
    } else {
      // Try width/height attributes
      const widthMatch = content.match(/width=["']([^"']+)["']/);
      const heightMatch = content.match(/height=["']([^"']+)["']/);
      
      if (widthMatch) width = parseFloat(widthMatch[1]) || null;
      if (heightMatch) height = parseFloat(heightMatch[1]) || null;
    }

    return {
      type: 'vector',
      format: 'svg',
      width,
      height,
      has_transparency: content.includes('opacity') || content.includes('fill-opacity'),
    };
  }

  return {
    type: 'vector',
    format,
  };
}
