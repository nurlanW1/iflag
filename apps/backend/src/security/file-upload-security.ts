// File Upload Security Service
// Comprehensive security validation for file uploads

import { readFile } from 'fs/promises';
import { createHash } from 'crypto';

export interface FileSecurityCheck {
  safe: boolean;
  threats: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

export interface UploadedFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
}

export class FileUploadSecurityService {
  private readonly MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  private readonly MAX_UPLOAD_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  private readonly ALLOWED_MIME_TYPES = [
    'image/svg+xml',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/tiff',
    'video/mp4',
    'video/webm',
    'application/postscript', // EPS
  ];
  private readonly ALLOWED_EXTENSIONS = [
    '.svg', '.eps', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.mp4', '.webm'
  ];
  private readonly DANGEROUS_PATTERNS = [
    /<\?php/i,
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /eval\(/i,
    /exec\(/i,
    /system\(/i,
  ];

  /**
   * Comprehensive security check
   */
  async checkFile(file: UploadedFile): Promise<FileSecurityCheck> {
    const threats: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {};

    // 1. Size check
    if (file.size > this.MAX_FILE_SIZE) {
      threats.push(`File size exceeds maximum: ${this.MAX_FILE_SIZE} bytes`);
    }

    if (file.size === 0) {
      threats.push('File is empty');
    }

    // 2. Filename validation
    const filenameCheck = this.validateFilename(file.filename);
    if (!filenameCheck.safe) {
      threats.push(...filenameCheck.threats);
    }

    // 3. MIME type validation
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      threats.push(`MIME type not allowed: ${file.mimetype}`);
    }

    // 4. Extension validation
    const extension = this.getExtension(file.filename);
    if (!this.ALLOWED_EXTENSIONS.includes(extension.toLowerCase())) {
      threats.push(`File extension not allowed: ${extension}`);
    }

    // 5. Magic number validation
    const magicCheck = await this.checkMagicNumber(file.buffer, file.mimetype);
    if (!magicCheck.valid) {
      threats.push(`Magic number mismatch: ${magicCheck.reason}`);
    } else {
      metadata.magicNumber = magicCheck.detectedFormat;
    }

    // 6. Content analysis
    const contentCheck = await this.analyzeContent(file.buffer, file.mimetype);
    if (contentCheck.hasThreats) {
      threats.push(...contentCheck.threats);
    }
    if (contentCheck.hasWarnings) {
      warnings.push(...contentCheck.warnings);
    }

    // 7. File hash
    metadata.hash = this.calculateHash(file.buffer);
    metadata.size = file.size;

    return {
      safe: threats.length === 0,
      threats,
      warnings,
      metadata,
    };
  }

  /**
   * Validate filename
   */
  private validateFilename(filename: string): { safe: boolean; threats: string[] } {
    const threats: string[] = [];

    // Check for path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      threats.push('Path traversal detected in filename');
    }

    // Check for null bytes
    if (filename.includes('\0')) {
      threats.push('Null byte detected in filename');
    }

    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      threats.push('Dangerous characters detected in filename');
    }

    // Check length
    if (filename.length > 255) {
      threats.push('Filename too long (max 255 characters)');
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  }

  /**
   * Get file extension
   */
  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot);
  }

  /**
   * Check magic number (file signature)
   */
  private async checkMagicNumber(
    buffer: Buffer,
    expectedMimeType: string
  ): Promise<{ valid: boolean; reason?: string; detectedFormat?: string }> {
    if (buffer.length < 16) {
      return { valid: false, reason: 'File too small to check magic number' };
    }

    const magic = buffer.slice(0, 16);

    // SVG (text-based)
    if (expectedMimeType === 'image/svg+xml') {
      const content = buffer.toString('utf8', 0, Math.min(100, buffer.length));
      if (content.includes('<svg') || content.includes('<?xml')) {
        return { valid: true, detectedFormat: 'svg' };
      }
      return { valid: false, reason: 'SVG magic number not found' };
    }

    // PNG
    if (expectedMimeType === 'image/png') {
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      if (magic.slice(0, 8).every((byte, i) => byte === pngSignature[i])) {
        return { valid: true, detectedFormat: 'png' };
      }
      return { valid: false, reason: 'PNG magic number mismatch' };
    }

    // JPEG
    if (expectedMimeType === 'image/jpeg' || expectedMimeType === 'image/jpg') {
      if (magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF) {
        return { valid: true, detectedFormat: 'jpeg' };
      }
      return { valid: false, reason: 'JPEG magic number mismatch' };
    }

    // MP4
    if (expectedMimeType === 'video/mp4') {
      if (magic[4] === 0x66 && magic[5] === 0x74 && magic[6] === 0x79 && magic[7] === 0x70) {
        return { valid: true, detectedFormat: 'mp4' };
      }
      return { valid: false, reason: 'MP4 magic number mismatch' };
    }

    // WebM
    if (expectedMimeType === 'video/webm') {
      if (magic[0] === 0x1A && magic[1] === 0x45 && magic[2] === 0xDF && magic[3] === 0xA3) {
        return { valid: true, detectedFormat: 'webm' };
      }
      return { valid: false, reason: 'WebM magic number mismatch' };
    }

    // EPS
    if (expectedMimeType === 'application/postscript') {
      const content = buffer.toString('utf8', 0, Math.min(4, buffer.length));
      if (content === '%!PS') {
        return { valid: true, detectedFormat: 'eps' };
      }
      return { valid: false, reason: 'EPS magic number mismatch' };
    }

    return { valid: true }; // Unknown format, allow if MIME type matches
  }

  /**
   * Analyze file content for threats
   */
  private async analyzeContent(
    buffer: Buffer,
    mimetype: string
  ): Promise<{
    hasThreats: boolean;
    threats: string[];
    hasWarnings: boolean;
    warnings: string[];
  }> {
    const threats: string[] = [];
    const warnings: string[] = [];

    // For text-based files (SVG, etc.), check for script injection
    if (mimetype === 'image/svg+xml' || mimetype.includes('text')) {
      const content = buffer.toString('utf8');
      
      for (const pattern of this.DANGEROUS_PATTERNS) {
        if (pattern.test(content)) {
          threats.push(`Dangerous pattern detected: ${pattern}`);
        }
      }

      // Check for external resource references
      if (content.includes('http://') || content.includes('https://')) {
        warnings.push('External resource references detected');
      }
    }

    // Check file entropy (high entropy might indicate encryption/obfuscation)
    const entropy = this.calculateEntropy(buffer);
    if (entropy > 7.5) {
      warnings.push('High entropy detected (possible encryption or obfuscation)');
    }

    return {
      hasThreats: threats.length > 0,
      threats,
      hasWarnings: warnings.length > 0,
      warnings,
    };
  }

  /**
   * Calculate file hash
   */
  private calculateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Calculate file entropy
   */
  private calculateEntropy(buffer: Buffer): number {
    const byteCounts = new Array(256).fill(0);
    for (let i = 0; i < buffer.length; i++) {
      byteCounts[buffer[i]]++;
    }

    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (byteCounts[i] > 0) {
        const probability = byteCounts[i] / buffer.length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    // Remove path components
    let sanitized = filename.replace(/^.*[\\\/]/, '');
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = this.getExtension(sanitized);
      sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }

    return sanitized || 'file';
  }
}

export const fileUploadSecurityService = new FileUploadSecurityService();
