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

export type CategoryCardVisual = {
  Icon: LucideIcon;
  /** Icon circle + faint ring tint */
  accent: string;
  /** Small label chip */
  chip: string;
};

export function visualsForCategoryKind(kind: CategoryKind): CategoryCardVisual {
  switch (kind) {
    case 'country_flags':
      return {
        Icon: Flag,
        accent: 'bg-emerald-600/95 text-white ring-emerald-700/35',
        chip: 'Sovereign & national',
      };
    case 'autonomy_flags':
      return {
        Icon: Building2,
        accent: 'bg-teal-600/95 text-white ring-teal-700/35',
        chip: 'Regions',
      };
    case 'historical_flags':
      return {
        Icon: History,
        accent: 'bg-amber-700/95 text-white ring-amber-800/35',
        chip: 'Archive',
      };
    case 'organization_flags':
      return {
        Icon: Globe2,
        accent: 'bg-sky-600/95 text-white ring-sky-700/35',
        chip: 'Intergovernmental',
      };
    case 'institution_flags':
      return {
        Icon: Landmark,
        accent: 'bg-violet-600/95 text-white ring-violet-700/35',
        chip: 'Institutions',
      };
    case 'flag_mockups':
      return {
        Icon: LayoutTemplate,
        accent: 'bg-rose-600/95 text-white ring-rose-700/35',
        chip: 'Templates',
      };
    case 'flag_videos':
      return {
        Icon: Clapperboard,
        accent: 'bg-fuchsia-600/95 text-white ring-fuchsia-700/35',
        chip: 'Motion',
      };
    case 'flag_icons':
      return {
        Icon: ImageIcon,
        accent: 'bg-indigo-600/95 text-white ring-indigo-700/35',
        chip: 'Glyph sets',
      };
    case 'other':
      return {
        Icon: Sparkles,
        accent: 'bg-neutral-600/95 text-white ring-neutral-700/35',
        chip: 'Curated',
      };
  }
}
