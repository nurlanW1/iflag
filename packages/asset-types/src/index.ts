// Enhanced Asset Types with Format Support

export type AssetFormat = 
  // Vector
  | 'svg' | 'eps'
  // Raster
  | 'png' | 'jpg' | 'jpeg' | 'tiff' | 'tif'
  // Video
  | 'mp4' | 'webm' | 'mov'
  // Preview
  | 'webp' | 'gif';

export type AssetType = 
  | 'flag' 
  | 'symbol' 
  | 'video' 
  | 'animated' 
  | 'coat_of_arms' 
  | 'emblem';

export type ColorMode = 'rgb' | 'cmyk' | 'grayscale';
export type TransparencyMode = 'transparent' | 'opaque' | 'mixed';

export interface AssetFile {
  id: string;
  asset_id: string;
  format: AssetFormat;
  variant: string; // 'original', 'optimized', 'converted', 'preview', etc.
  size: string; // 'original', '1920x1280', '1080p', etc.
  quality?: number; // For JPEG (75-100)
  color_mode?: ColorMode;
  transparency?: TransparencyMode;
  file_path: string;
  file_size_bytes: number;
  width?: number;
  height?: number;
  duration_seconds?: number; // For video
  bitrate_kbps?: number; // For video
  codec?: string; // For video
  dpi?: number; // For print formats
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface Asset {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  asset_type: AssetType;
  category_id: string | null;
  
  // Primary file references
  original_file_url: string;
  preview_file_url: string | null;
  thumbnail_url: string | null;
  
  // Format metadata
  primary_format: AssetFormat;
  available_formats: AssetFormat[];
  color_mode?: ColorMode;
  transparency?: TransparencyMode;
  
  // Dimensions
  dimensions_width: number | null;
  dimensions_height: number | null;
  aspect_ratio: number | null; // width/height
  
  // Video-specific
  duration_seconds: number | null;
  has_audio: boolean;
  
  // File metadata
  file_format: string;
  file_size_bytes: number | null;
  
  // Variants
  has_transparent_version: boolean;
  has_opaque_version: boolean;
  available_resolutions: string[]; // ['1920x1280', '3840x2560']
  available_qualities: number[]; // [75, 85, 90] for JPEG
  
  // Pricing
  is_premium: boolean;
  download_count: number;
  
  // SEO
  keywords: string[] | null;
  country_code: string | null;
  organization_name: string | null;
  
  // Status
  status: 'draft' | 'published' | 'archived';
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  
  // Relations
  tags?: Array<{ id: string; name: string; slug: string }>;
  category?: { id: string; name: string; slug: string };
  files?: AssetFile[]; // All file variants
}

export interface FormatMetadata {
  format: AssetFormat;
  mime_type: string;
  extensions: string[];
  is_vector: boolean;
  is_raster: boolean;
  is_video: boolean;
  supports_transparency: boolean;
  supports_animation: boolean;
  max_dimensions?: { width: number; height: number };
  recommended_qualities?: number[];
  recommended_resolutions?: string[];
}

export const FORMAT_METADATA: Record<AssetFormat, FormatMetadata> = {
  // Vector
  svg: {
    format: 'svg',
    mime_type: 'image/svg+xml',
    extensions: ['.svg'],
    is_vector: true,
    is_raster: false,
    is_video: false,
    supports_transparency: true,
    supports_animation: true,
  },
  eps: {
    format: 'eps',
    mime_type: 'application/postscript',
    extensions: ['.eps', '.epsi'],
    is_vector: true,
    is_raster: false,
    is_video: false,
    supports_transparency: true,
    supports_animation: false,
  },
  
  // Raster
  png: {
    format: 'png',
    mime_type: 'image/png',
    extensions: ['.png'],
    is_vector: false,
    is_raster: true,
    is_video: false,
    supports_transparency: true,
    supports_animation: true, // APNG
    recommended_resolutions: ['300x200', '800x533', '1920x1280', '3840x2560'],
  },
  jpg: {
    format: 'jpg',
    mime_type: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    is_vector: false,
    is_raster: true,
    is_video: false,
    supports_transparency: false,
    supports_animation: false,
    recommended_qualities: [75, 85, 90],
    recommended_resolutions: ['300x200', '800x533', '1920x1280', '3840x2560'],
  },
  jpeg: {
    format: 'jpeg',
    mime_type: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    is_vector: false,
    is_raster: true,
    is_video: false,
    supports_transparency: false,
    supports_animation: false,
    recommended_qualities: [75, 85, 90],
    recommended_resolutions: ['300x200', '800x533', '1920x1280', '3840x2560'],
  },
  tiff: {
    format: 'tiff',
    mime_type: 'image/tiff',
    extensions: ['.tiff', '.tif'],
    is_vector: false,
    is_raster: true,
    is_video: false,
    supports_transparency: true,
    supports_animation: false,
    max_dimensions: { width: 12000, height: 8000 },
  },
  tif: {
    format: 'tif',
    mime_type: 'image/tiff',
    extensions: ['.tiff', '.tif'],
    is_vector: false,
    is_raster: true,
    is_video: false,
    supports_transparency: true,
    supports_animation: false,
    max_dimensions: { width: 12000, height: 8000 },
  },
  
  // Video
  mp4: {
    format: 'mp4',
    mime_type: 'video/mp4',
    extensions: ['.mp4'],
    is_vector: false,
    is_raster: false,
    is_video: true,
    supports_transparency: false,
    supports_animation: true,
    recommended_resolutions: ['480p', '720p', '1080p', '4k'],
  },
  webm: {
    format: 'webm',
    mime_type: 'video/webm',
    extensions: ['.webm'],
    is_vector: false,
    is_raster: false,
    is_video: true,
    supports_transparency: true,
    supports_animation: true,
    recommended_resolutions: ['480p', '720p', '1080p', '4k'],
  },
  mov: {
    format: 'mov',
    mime_type: 'video/quicktime',
    extensions: ['.mov'],
    is_vector: false,
    is_raster: false,
    is_video: true,
    supports_transparency: false,
    supports_animation: true,
    recommended_resolutions: ['480p', '720p', '1080p', '4k'],
  },
  
  // Preview
  webp: {
    format: 'webp',
    mime_type: 'image/webp',
    extensions: ['.webp'],
    is_vector: false,
    is_raster: true,
    is_video: false,
    supports_transparency: true,
    supports_animation: true,
    recommended_resolutions: ['300x200', '800x533', '1920x1280'],
  },
  gif: {
    format: 'gif',
    mime_type: 'image/gif',
    extensions: ['.gif'],
    is_vector: false,
    is_raster: true,
    is_video: false,
    supports_transparency: true,
    supports_animation: true,
    recommended_resolutions: ['300x200', '800x533'],
  },
};

export function getFormatMetadata(format: AssetFormat): FormatMetadata {
  return FORMAT_METADATA[format];
}

export function detectFormatFromFilename(filename: string): AssetFormat | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return null;
  
  for (const [format, metadata] of Object.entries(FORMAT_METADATA)) {
    if (metadata.extensions.some(e => e.slice(1) === ext)) {
      return format as AssetFormat;
    }
  }
  
  return null;
}

export function generateAssetFilename(
  slug: string,
  format: AssetFormat,
  variant: string = 'original',
  size?: string,
  quality?: number,
  timestamp?: number
): string {
  const parts = [slug];
  
  if (timestamp) {
    parts.push(timestamp.toString());
  } else {
    parts.push(Date.now().toString());
  }
  
  // Add hash for uniqueness (simplified)
  const hash = Math.random().toString(36).substring(2, 10);
  parts.push(hash);
  
  if (variant !== 'original') {
    parts.push(variant);
  }
  
  if (size) {
    parts.push(size);
  }
  
  if (quality) {
    parts.push(`q${quality}`);
  }
  
  const ext = FORMAT_METADATA[format].extensions[0].slice(1);
  return `${parts.join('-')}.${ext}`;
}
