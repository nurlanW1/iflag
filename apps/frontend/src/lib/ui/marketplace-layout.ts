/**
 * Shared responsive grids for Flagswing (shell max-width 1800px).
 *
 * Breakpoint intent:
 * - Narrow mobile: 1 column
 * - Mobile+: 2 columns
 * - Tablet: 3 columns
 * - Desktop: 4 columns (“normal”)
 * - 2xl: 5 columns (large desktop — never 6/7 wide columns on ultrawide)
 */

/** Product / country card grids (browse, assets, gallery CardGrid, related products). */
export const marketplaceProductCardGridClasses =
  'grid min-w-0 grid-cols-1 gap-4 xs:grid-cols-2 xs:gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-6 xl:grid-cols-4 xl:gap-7 2xl:grid-cols-5 2xl:gap-8';

/** Home landing: larger square country tiles (fewer columns → bigger tiles). */
export const galleryHomeLargeTileGridClasses =
  'grid min-w-0 grid-cols-1 gap-4 xs:grid-cols-2 xs:gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-7 xl:grid-cols-4 xl:gap-8 2xl:grid-cols-5 2xl:gap-8';

/**
 * Dense gallery grids (embedded lists) — still capped at 5 columns on large screens.
 */
export const galleryCompactTileGridClasses =
  'grid min-w-0 grid-cols-1 gap-3 xs:grid-cols-2 xs:gap-4 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-4 xl:gap-6 2xl:grid-cols-5 2xl:gap-7';
