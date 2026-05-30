export type HeroCategoryTab =
  | 'all'
  | 'countries'
  | 'circular'
  | 'historical'
  | 'organizations'
  | 'sports';

export const HERO_TABS: { id: HeroCategoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'countries', label: 'Countries' },
  { id: 'circular', label: 'Circular' },
  { id: 'historical', label: 'Historical' },
  { id: 'organizations', label: 'Organizations' },
  { id: 'sports', label: 'Sports' },
];

export function buildHeroDestination(tab: HeroCategoryTab, qRaw: string): string {
  const q = qRaw.trim();
  switch (tab) {
    case 'all':
      return q ? `/gallery?q=${encodeURIComponent(q)}` : '/gallery';
    case 'countries':
      return q ? `/gallery?q=${encodeURIComponent(q)}` : '/gallery';
    case 'circular':
      return q ? `/gallery?q=${encodeURIComponent(`circular ${q}`)}` : '/gallery?q=circular';
    case 'historical':
      return q ? `/gallery?q=${encodeURIComponent(q)}` : '/gallery?kind=historical';
    case 'organizations':
      return q ? `/gallery?q=${encodeURIComponent(q)}` : '/gallery?kind=organizations';
    case 'sports':
      return q ? `/gallery?q=${encodeURIComponent(q)}` : '/gallery?q=sports';
    default:
      return '/gallery';
  }
}

export const HERO_TRENDING = ['USA', 'France', 'Japan', 'Germany', 'UK', 'Brazil', 'Canada'] as const;
