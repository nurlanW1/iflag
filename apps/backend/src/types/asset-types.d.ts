declare module 'asset-types' {
  export type AssetFormat = string;
  export function detectFormatFromFilename(filename: string): AssetFormat | null;
  export function generateAssetFilename(prefix: string, format: AssetFormat, variant: string, size?: string, quality?: number): string;
  export const FORMAT_METADATA: Record<string, any>;
}
