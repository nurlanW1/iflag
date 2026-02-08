declare module 'storage/cloud-storage' {
  export class CloudStorageService {
    constructor(config: any);
    upload(buffer: Buffer, filename: string, folder: string): Promise<string>;
    delete(filePath: string): Promise<void>;
    getPresignedUrl(filePath: string, options?: { expiresIn?: number; responseContentDisposition?: string }): Promise<string>;
    generateSecureCDNUrl(filePath: string, token?: string, expiresAt?: number): string;
    generateAssetPath(...args: any[]): string;
    invalidateCache(urls: string[]): Promise<void>;
  }
  export function createCloudStorageProvider(config: any): CloudStorageService;
}
