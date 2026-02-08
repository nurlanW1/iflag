// Format Registry
// Dynamic format registration and management

export interface FormatHandler {
  formatCode: string;
  formatName: string;
  formatCategory: 'vector' | 'raster' | 'video' | 'audio' | 'document' | 'other';
  mimeTypes: string[];
  extensions: string[];
  capabilities: {
    transparency?: boolean;
    animation?: boolean;
    layers?: boolean;
    metadata?: boolean;
    [key: string]: any;
  };
  validate: (buffer: Buffer) => Promise<ValidationResult>;
  extractMetadata: (buffer: Buffer) => Promise<Metadata>;
  generatePreview: (buffer: Buffer, options?: PreviewOptions) => Promise<Buffer>;
  optimize?: (buffer: Buffer, options?: OptimizeOptions) => Promise<Buffer>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface Metadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  codec?: string;
  colorMode?: string;
  dpi?: number;
  [key: string]: any;
}

export interface PreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
}

export interface OptimizeOptions {
  quality?: number;
  compression?: number;
  removeMetadata?: boolean;
}

export class FormatRegistry {
  private handlers: Map<string, FormatHandler> = new Map();
  private handlersByCategory: Map<string, FormatHandler[]> = new Map();
  private handlersByMimeType: Map<string, FormatHandler> = new Map();
  private handlersByExtension: Map<string, FormatHandler> = new Map();

  /**
   * Register a format handler
   */
  register(handler: FormatHandler): void {
    // Validate handler
    if (!handler.formatCode || !handler.formatName) {
      throw new Error('Format handler must have formatCode and formatName');
    }

    if (this.handlers.has(handler.formatCode)) {
      throw new Error(`Format ${handler.formatCode} is already registered`);
    }

    // Register handler
    this.handlers.set(handler.formatCode, handler);

    // Index by category
    if (!this.handlersByCategory.has(handler.formatCategory)) {
      this.handlersByCategory.set(handler.formatCategory, []);
    }
    this.handlersByCategory.get(handler.formatCategory)!.push(handler);

    // Index by MIME type
    for (const mimeType of handler.mimeTypes) {
      this.handlersByMimeType.set(mimeType.toLowerCase(), handler);
    }

    // Index by extension
    for (const extension of handler.extensions) {
      const ext = extension.startsWith('.') ? extension : `.${extension}`;
      this.handlersByExtension.set(ext.toLowerCase(), handler);
    }
  }

  /**
   * Get handler by format code
   */
  get(formatCode: string): FormatHandler | undefined {
    return this.handlers.get(formatCode.toLowerCase());
  }

  /**
   * Get handler by MIME type
   */
  getByMimeType(mimeType: string): FormatHandler | undefined {
    return this.handlersByMimeType.get(mimeType.toLowerCase());
  }

  /**
   * Get handler by file extension
   */
  getByExtension(extension: string): FormatHandler | undefined {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return this.handlersByExtension.get(ext.toLowerCase());
  }

  /**
   * Get all handlers for a category
   */
  getByCategory(category: string): FormatHandler[] {
    return this.handlersByCategory.get(category) || [];
  }

  /**
   * Get all registered formats
   */
  getAll(): FormatHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Check if format is registered
   */
  has(formatCode: string): boolean {
    return this.handlers.has(formatCode.toLowerCase());
  }

  /**
   * Unregister a format
   */
  unregister(formatCode: string): boolean {
    const handler = this.handlers.get(formatCode.toLowerCase());
    if (!handler) return false;

    this.handlers.delete(formatCode.toLowerCase());

    // Remove from category index
    const categoryHandlers = this.handlersByCategory.get(handler.formatCategory);
    if (categoryHandlers) {
      const index = categoryHandlers.indexOf(handler);
      if (index > -1) {
        categoryHandlers.splice(index, 1);
      }
    }

    // Remove from MIME type index
    for (const mimeType of handler.mimeTypes) {
      this.handlersByMimeType.delete(mimeType.toLowerCase());
    }

    // Remove from extension index
    for (const extension of handler.extensions) {
      const ext = extension.startsWith('.') ? extension : `.${extension}`;
      this.handlersByExtension.delete(ext.toLowerCase());
    }

    return true;
  }

  /**
   * Detect format from file
   */
  async detectFormat(buffer: Buffer, filename?: string, mimeType?: string): Promise<FormatHandler | null> {
    // Try MIME type first
    if (mimeType) {
      const handler = this.getByMimeType(mimeType);
      if (handler) return handler;
    }

    // Try extension
    if (filename) {
      const extension = filename.substring(filename.lastIndexOf('.'));
      const handler = this.getByExtension(extension);
      if (handler) return handler;
    }

    // Try magic number detection
    return this.detectByMagicNumber(buffer);
  }

  /**
   * Detect format by magic number
   */
  private async detectByMagicNumber(buffer: Buffer): Promise<FormatHandler | null> {
    if (buffer.length < 16) return null;

    const magic = buffer.slice(0, 16);

    // Check all handlers
    for (const handler of this.handlers.values()) {
      // Handler can implement custom detection
      if (handler.validate) {
        try {
          const result = await handler.validate(buffer);
          if (result.valid) {
            return handler;
          }
        } catch {
          // Continue to next handler
        }
      }
    }

    return null;
  }
}

// Singleton instance
export const formatRegistry = new FormatRegistry();
