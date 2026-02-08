// Format Validator - Validates file formats

import { detectFormatFromFilename, FORMAT_METADATA } from 'asset-types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  format?: string;
  metadata?: Record<string, any>;
}

// Validate file format
export async function validateFileFormat(
  file_buffer: Buffer,
  mime_type: string,
  expected_format?: string
): Promise<ValidationResult> {
  // Check file size
  if (file_buffer.length === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check magic numbers (file signatures)
  const magic_number = file_buffer.slice(0, 16);
  const detected_format = detectFormatByMagicNumber(magic_number);

  if (expected_format && detected_format !== expected_format) {
    return {
      valid: false,
      error: `Format mismatch: expected ${expected_format}, detected ${detected_format}`,
    };
  }

  // Format-specific validation
  const format = expected_format || detected_format;
  if (!format) {
    return { valid: false, error: 'Unable to detect file format' };
  }

  const format_metadata = FORMAT_METADATA[format as keyof typeof FORMAT_METADATA];
  if (!format_metadata) {
    return { valid: false, error: `Unsupported format: ${format}` };
  }

  // Validate MIME type matches format
  if (format_metadata.mime_type !== mime_type) {
    return {
      valid: false,
      error: `MIME type mismatch: expected ${format_metadata.mime_type}, got ${mime_type}`,
    };
  }

  // Format-specific deep validation
  const deep_validation = await validateFormatDeep(file_buffer, format);
  if (!deep_validation.valid) {
    return deep_validation;
  }

  return {
    valid: true,
    format,
    metadata: deep_validation.metadata,
  };
}

// Detect format by magic number
function detectFormatByMagicNumber(magic: Buffer): string | null {
  // SVG (text-based, check for XML declaration)
  if (magic.toString('utf8', 0, Math.min(100, magic.length)).includes('<?xml') ||
      magic.toString('utf8', 0, Math.min(100, magic.length)).includes('<svg')) {
    return 'svg';
  }

  // PNG
  if (magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47) {
    return 'png';
  }

  // JPEG
  if (magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF) {
    return 'jpg';
  }

  // TIFF
  if ((magic[0] === 0x49 && magic[1] === 0x49 && magic[2] === 0x2A && magic[3] === 0x00) ||
      (magic[0] === 0x4D && magic[1] === 0x4D && magic[2] === 0x00 && magic[3] === 0x2A)) {
    return 'tiff';
  }

  // MP4
  if (magic[4] === 0x66 && magic[5] === 0x74 && magic[6] === 0x79 && magic[7] === 0x70) {
    return 'mp4';
  }

  // WebM
  if (magic[0] === 0x1A && magic[1] === 0x45 && magic[2] === 0xDF && magic[3] === 0xA3) {
    return 'webm';
  }

  // EPS (PostScript)
  if (magic.toString('utf8', 0, Math.min(4, magic.length)) === '%!PS') {
    return 'eps';
  }

  return null;
}

// Deep format validation
async function validateFormatDeep(
  file_buffer: Buffer,
  format: string
): Promise<ValidationResult> {
  try {
    switch (format) {
      case 'svg':
        return await validateSVG(file_buffer);
      case 'png':
        return await validatePNG(file_buffer);
      case 'jpg':
      case 'jpeg':
        return await validateJPEG(file_buffer);
      case 'mp4':
        return await validateMP4(file_buffer);
      case 'webm':
        return await validateWebM(file_buffer);
      default:
        return { valid: true };
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// SVG validation
async function validateSVG(buffer: Buffer): Promise<ValidationResult> {
  const content = buffer.toString('utf8');
  
  // Check for XML declaration or SVG element
  if (!content.includes('<svg') && !content.includes('<?xml')) {
    return { valid: false, error: 'Invalid SVG: missing SVG element' };
  }

  // Try to parse as XML (basic check)
  try {
    // Simple well-formedness check
    const open_tags = (content.match(/<[^/][^>]*>/g) || []).length;
    const close_tags = (content.match(/<\/[^>]+>/g) || []).length;
    
    // SVG should have at least one open tag
    if (open_tags === 0) {
      return { valid: false, error: 'Invalid SVG: no valid tags found' };
    }
  } catch (error) {
    return { valid: false, error: 'Invalid SVG structure' };
  }

  return { valid: true };
}

// PNG validation
async function validatePNG(buffer: Buffer): Promise<ValidationResult> {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.length < 8) {
    return { valid: false, error: 'PNG file too small' };
  }

  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== signature[i]) {
      return { valid: false, error: 'Invalid PNG signature' };
    }
  }

  // Extract dimensions from IHDR chunk
  if (buffer.length >= 24) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    
    if (width === 0 || height === 0) {
      return { valid: false, error: 'Invalid PNG dimensions' };
    }

    return {
      valid: true,
      metadata: { width, height },
    };
  }

  return { valid: true };
}

// JPEG validation
async function validateJPEG(buffer: Buffer): Promise<ValidationResult> {
  // JPEG signature: FF D8 FF
  if (buffer.length < 3) {
    return { valid: false, error: 'JPEG file too small' };
  }

  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
    return { valid: false, error: 'Invalid JPEG signature' };
  }

  // Try to extract dimensions (requires parsing JFIF/EXIF)
  // For now, basic validation is sufficient
  return { valid: true };
}

// MP4 validation
async function validateMP4(buffer: Buffer): Promise<ValidationResult> {
  // MP4 starts with ftyp box at offset 4
  if (buffer.length < 12) {
    return { valid: false, error: 'MP4 file too small' };
  }

  // Check for 'ftyp' at offset 4
  const ftyp = buffer.toString('ascii', 4, 8);
  if (ftyp !== 'ftyp') {
    return { valid: false, error: 'Invalid MP4: missing ftyp box' };
  }

  return { valid: true };
}

// WebM validation
async function validateWebM(buffer: Buffer): Promise<ValidationResult> {
  // WebM starts with EBML header
  if (buffer.length < 4) {
    return { valid: false, error: 'WebM file too small' };
  }

  // Check for EBML signature
  if (buffer[0] !== 0x1A || buffer[1] !== 0x45 || buffer[2] !== 0xDF || buffer[3] !== 0xA3) {
    return { valid: false, error: 'Invalid WebM signature' };
  }

  return { valid: true };
}
