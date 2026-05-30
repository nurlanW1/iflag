import type { LucideIcon } from 'lucide-react';
import { Flag, Globe2 } from 'lucide-react';

/** Olympic-rings–inspired continent colors (white icons on saturated panels). */
export type RegionHubTile = {
  name: string;
  icon: LucideIcon;
  href: string;
  /** Panel background */
  bg: string;
  /** Slightly lighter icon well (optional) */
  iconWell: string;
};

export const HOME_REGION_HUB_TILES: RegionHubTile[] = [
  {
    name: 'Europe',
    icon: Globe2,
    href: '/gallery?region=Europe',
    bg: '#0085C7',
    iconWell: 'rgba(255,255,255,0.18)',
  },
  {
    name: 'Asia',
    icon: Globe2,
    href: '/gallery?region=Asia',
    bg: '#C99700',
    iconWell: 'rgba(255,255,255,0.2)',
  },
  {
    name: 'Africa',
    icon: Globe2,
    href: '/gallery?region=Africa',
    bg: '#1A1A1A',
    iconWell: 'rgba(255,255,255,0.14)',
  },
  {
    name: 'Americas',
    icon: Globe2,
    href: '/gallery?region=Americas',
    bg: '#DF0024',
    iconWell: 'rgba(255,255,255,0.18)',
  },
  {
    name: 'Oceania',
    icon: Globe2,
    href: '/gallery?region=Oceania',
    bg: '#009B3A',
    iconWell: 'rgba(255,255,255,0.18)',
  },
  {
    name: 'Organizations',
    icon: Flag,
    href: '/gallery?kind=organizations',
    bg: '#4F46E5',
    iconWell: 'rgba(255,255,255,0.18)',
  },
  {
    name: 'Autonomy',
    icon: Globe2,
    href: '/gallery?kind=autonomy',
    bg: '#0D9488',
    iconWell: 'rgba(255,255,255,0.18)',
  },
  {
    name: 'Historical Flag',
    icon: Flag,
    href: '/gallery?kind=historical',
    bg: '#7C2D12',
    iconWell: 'rgba(255,255,255,0.16)',
  },
];
