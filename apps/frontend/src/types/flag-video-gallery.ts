/** One published flag video tile for `/categories/flag-videos`. */
export type FlagVideoSummary = {
  id: string;
  productSlug: string;
  title: string;
  countryName: string;
  countrySlug: string;
  countryCode: string | null;
  format: string;
  thumbnail: string;
  sortKey: string;
};
