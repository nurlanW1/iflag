// Asset Type Registry
// Dynamic asset type registration and management

export interface AssetTypeHandler {
  typeCode: string;
  typeName: string;
  metadataSchema: any; // JSON Schema
  defaultVariants: string[];
  requiredFields: string[];
  optionalFields: string[];
  validateMetadata: (metadata: any) => Promise<ValidationResult>;
  processAsset: (asset: Asset) => Promise<void>;
  generateSearchTerms: (asset: Asset) => string[];
  getAdminFields?: () => AdminField[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface Asset {
  id: string;
  typeCode: string;
  metadata: Record<string, any>;
  [key: string]: any;
}

export interface AdminField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'json';
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
  helpText?: string;
}

export class AssetTypeRegistry {
  private handlers: Map<string, AssetTypeHandler> = new Map();

  /**
   * Register an asset type handler
   */
  register(handler: AssetTypeHandler): void {
    if (!handler.typeCode || !handler.typeName) {
      throw new Error('Asset type handler must have typeCode and typeName');
    }

    if (this.handlers.has(handler.typeCode)) {
      throw new Error(`Asset type ${handler.typeCode} is already registered`);
    }

    this.handlers.set(handler.typeCode, handler);
  }

  /**
   * Get handler by type code
   */
  get(typeCode: string): AssetTypeHandler | undefined {
    return this.handlers.get(typeCode);
  }

  /**
   * Get all registered types
   */
  getAll(): AssetTypeHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Check if type is registered
   */
  has(typeCode: string): boolean {
    return this.handlers.has(typeCode);
  }

  /**
   * Validate metadata for asset type
   */
  async validateMetadata(typeCode: string, metadata: any): Promise<ValidationResult> {
    const handler = this.get(typeCode);
    if (!handler) {
      return {
        valid: false,
        errors: [`Unknown asset type: ${typeCode}`],
      };
    }

    return handler.validateMetadata(metadata);
  }

  /**
   * Process asset (type-specific processing)
   */
  async processAsset(asset: Asset): Promise<void> {
    const handler = this.get(asset.typeCode);
    if (!handler) {
      throw new Error(`No handler for asset type: ${asset.typeCode}`);
    }

    await handler.processAsset(asset);
  }

  /**
   * Generate search terms for asset
   */
  generateSearchTerms(asset: Asset): string[] {
    const handler = this.get(asset.typeCode);
    if (!handler) {
      return [];
    }

    return handler.generateSearchTerms(asset);
  }

  /**
   * Get admin fields for asset type
   */
  getAdminFields(typeCode: string): AdminField[] {
    const handler = this.get(typeCode);
    if (!handler || !handler.getAdminFields) {
      return [];
    }

    return handler.getAdminFields();
  }
}

// Singleton instance
export const assetTypeRegistry = new AssetTypeRegistry();
