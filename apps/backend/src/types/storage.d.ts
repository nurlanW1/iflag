declare module 'storage' {
  export function createStorageProvider(config?: { type?: string; baseUrl?: string; basePath?: string }): any;
  export function getAssetFolder(assetId: string): string;
  export function generateUniqueFilename(originalName: string): string;
}
