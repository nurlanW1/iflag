import type { LucideIcon } from 'lucide-react';
import { Globe2 } from 'lucide-react';

/** Olympic-rings–inspired accent colors (icon well only; hub tile panel is white). */
export type RegionHubTile = {
  name: string;
  icon: LucideIcon;
  href: string;
  /** Colored square behind the icon */
  accent: string;
};

export const HOME_REGION_HUB_TILES: RegionHubTile[] = [
  {
    name: 'Europe',
    icon: Globe2,
    href: '/gallery?region=Europe',
    accent: '#0085C7',
  },
  {
    name: 'Asia',
    icon: Globe2,
    href: '/gallery?region=Asia',
    accent: '#C99700',
  },
  {
    name: 'Africa',
    icon: Globe2,
    href: '/gallery?region=Africa',
    accent: '#1A1A1A',
  },
  {
    name: 'Americas',
    icon: Globe2,
    href: '/gallery?region=Americas',
    accent: '#DF0024',
  },
  {
    name: 'Oceania',
    icon: Globe2,
    href: '/gallery?region=Oceania',
    accent: '#009B3A',
  },
];
