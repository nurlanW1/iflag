declare module 'watermarking' {
  export function addWatermark(imageBuffer: Buffer, watermarkText: string): Promise<Buffer>;
  export function addWatermarkImage(imageBuffer: Buffer, options: { text?: string; opacity?: number; position?: string }): Promise<Buffer>;
}
