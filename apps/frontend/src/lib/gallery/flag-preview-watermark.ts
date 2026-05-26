/**
 * Watermark policy: premium catalog designs only.
 * Free official flags and country hub WebP covers are never watermarked.
 */

export function shouldWatermarkFlagPreview(options: {
  /** Creative / paid catalog design (not free official flat). */
  isPremiumDesign?: boolean;
  /** Country folder WebP hub hero — never watermark. */
  isCountryHubCover?: boolean;
}): boolean {
  if (options.isCountryHubCover) return false;
  return Boolean(options.isPremiumDesign);
}

export function variantFormatsArePremium(
  formats: Array<{ premiumTier?: string | null }>,
): boolean {
  return formats.some((f) => {
    const t = (f.premiumTier ?? 'free').toLowerCase();
    return t === 'paid' || t === 'freemium';
  });
}
