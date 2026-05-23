import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Clapperboard,
  Flag,
  Globe2,
  History,
  ImageIcon,
  Landmark,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react';
import type { CategoryKind } from '@/types/marketplace';

/** Shared hub icon tile — dark blue glyphs on soft brand blue (site-wide accent). */
const CATEGORY_ICON_ACCENT =
  'bg-[var(--brand-blue-soft)] text-[var(--nav-link-text)] ring-1 ring-inset ring-[var(--brand-blue)]/22';

export type CategoryCardVisual = {
  Icon: LucideIcon;
  /** Icon tile background + ring; icon uses `currentColor` → dark blue */
  accent: string;
  /** Small label chip */
  chip: string;
};

export function visualsForCategoryKind(kind: CategoryKind): CategoryCardVisual {
  switch (kind) {
    case 'country_flags':
      return {
        Icon: Flag,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Sovereign & national',
      };
    case 'autonomy_flags':
      return {
        Icon: Building2,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Regions',
      };
    case 'historical_flags':
      return {
        Icon: History,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Archive',
      };
    case 'organization_flags':
      return {
        Icon: Globe2,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Intergovernmental',
      };
    case 'institution_flags':
      return {
        Icon: Landmark,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Institutions',
      };
    case 'flag_mockups':
      return {
        Icon: LayoutTemplate,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Templates',
      };
    case 'flag_videos':
      return {
        Icon: Clapperboard,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Motion',
      };
    case 'flag_icons':
      return {
        Icon: ImageIcon,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Glyph sets',
      };
    case 'other':
      return {
        Icon: Sparkles,
        accent: CATEGORY_ICON_ACCENT,
        chip: 'Curated',
      };
  }
}
