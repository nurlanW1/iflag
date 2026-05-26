/** Country folder hub card — shared by API responses and client grids. */
export type GalleryCountrySummary = {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  thumbnail_url: string;
  flag_count: number;
  design_count: number;
  thumbnail: string;
  count: number;
  /** True when a WebP master exists for this hub (folder cover). */
  has_webp_cover: boolean;
  /** Resolved WebP URL for folder cover; null when `has_webp_cover` is false. */
  webp_cover_url: string | null;
};
