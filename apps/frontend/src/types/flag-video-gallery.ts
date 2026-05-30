/** One published flag video tile for `/categories/flag-videos`. */
export type FlagVideoSummary = {
  id: string;
  productSlug: string;
  title: string;
  countryName: string;
  countrySlug: string;
  countryCode: string | null;
  format: string;
  /** Streamable MP4/WebM/MOV URL for in-browser playback. */
  videoUrl: string;
  /** Raster poster when available (not the video file). */
  thumbnail: string;
  sortKey: string;
};
