import React from 'react';
import type { CategoryKind } from '@/types/marketplace';

export type CategoryCardVisual = {
  /** Colorful flat SVG icon component */
  Icon: React.FC<{ className?: string }>;
  /** Icon tile background */
  accent: string;
  /** Small label chip */
  chip: string;
};

// ─── Flat-color SVG icon components ──────────────────────────────────────────

const CountryFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="2.5" height="20" rx="1.25" fill="#475569" />
    <path d="M6.5 3.5h13L17 8.5H6.5V3.5Z" fill="#2563EB" />
    <path d="M6.5 8.5h10.5L14.5 13.5H6.5V8.5Z" fill="#EF4444" />
    <path d="M6.5 13.5h8L12 18.5H6.5v-5Z" fill="#16A34A" />
  </svg>
);

const AutonomyFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C7.03 2 3 6.03 3 11c0 6.25 9 13 9 13s9-6.75 9-13c0-4.97-4.03-9-9-9Z" fill="#7C3AED" />
    <path d="M12 2C9.5 2 7.5 6 7.5 11c0 4 4.5 10 4.5 10s4.5-6 4.5-10c0-5-2-9-4.5-9Z" fill="#A78BFA" />
    <circle cx="12" cy="11" r="3" fill="#fff" />
    <circle cx="12" cy="11" r="1.5" fill="#7C3AED" />
  </svg>
);

const HistoricalFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="5" rx="7" ry="3" fill="#92400E" />
    <path d="M5 5v10l7 2 7-2V5" fill="#D97706" />
    <path d="M5 5v10l7 2V7L5 5Z" fill="#F59E0B" />
    <rect x="9" y="8" width="6" height="1.5" rx="0.75" fill="#92400E" />
    <rect x="9" y="11" width="6" height="1.5" rx="0.75" fill="#92400E" />
    <rect x="9" y="14" width="4" height="1.5" rx="0.75" fill="#92400E" />
  </svg>
);

const OrganizationFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" fill="#0891B2" />
    <ellipse cx="12" cy="12" rx="4" ry="9" fill="#0E7490" />
    <path d="M3 12h18M3.9 8h16.2M3.9 16h16.2" stroke="#BAE6FD" strokeWidth="1" />
    <path d="M12 3c-2 2-3.5 5-3.5 9s1.5 7 3.5 9" stroke="#BAE6FD" strokeWidth="1" fill="none" />
  </svg>
);

const InstitutionFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7h20L12 2Z" fill="#1D4ED8" />
    <rect x="4" y="18" width="16" height="3" rx="0.5" fill="#1E3A8A" />
    <rect x="4" y="7" width="3" height="11" rx="0.5" fill="#3B82F6" />
    <rect x="8.5" y="7" width="3" height="11" rx="0.5" fill="#3B82F6" />
    <rect x="13" y="7" width="3" height="11" rx="0.5" fill="#3B82F6" />
    <rect x="17" y="7" width="3" height="11" rx="0.5" fill="#3B82F6" />
  </svg>
);

const FlagMockupIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA580C" />
    <rect x="4" y="6" width="16" height="12" rx="1" fill="#FFF7ED" />
    <rect x="5" y="7" width="6" height="10" rx="0.5" fill="#FED7AA" />
    <rect x="12" y="7" width="7" height="4.5" rx="0.5" fill="#FB923C" />
    <rect x="12" y="12.5" width="7" height="4.5" rx="0.5" fill="#C2410C" />
  </svg>
);

const FlagVideoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="14" height="14" rx="2" fill="#DC2626" />
    <path d="M16 9.5l6-3v11l-6-3V9.5Z" fill="#EF4444" />
    <circle cx="9" cy="12" r="3.5" fill="#FCA5A5" />
    <path d="M7.5 10.5l4 1.5-4 1.5v-3Z" fill="#DC2626" />
  </svg>
);

const FlagIconsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="9" height="9" rx="2" fill="#059669" />
    <rect x="13" y="2" width="9" height="9" rx="2" fill="#10B981" />
    <rect x="2" y="13" width="9" height="9" rx="2" fill="#10B981" />
    <rect x="13" y="13" width="9" height="9" rx="2" fill="#059669" />
    <path d="M4 5.5h5M4 7.5h3" stroke="#D1FAE5" strokeWidth="1" strokeLinecap="round" />
    <path d="M15 5.5h5M15 7.5h3" stroke="#D1FAE5" strokeWidth="1" strokeLinecap="round" />
    <path d="M4 16.5h5M4 18.5h3" stroke="#D1FAE5" strokeWidth="1" strokeLinecap="round" />
    <path d="M15 16.5h5M15 18.5h3" stroke="#D1FAE5" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const CoatOfArmsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 6v8c0 4.5 4 7.5 9 9 5-1.5 9-4.5 9-9V6L12 2Z" fill="#1D4ED8" />
    <path d="M12 2L3 6v8c0 4.5 4 7.5 9 9V2Z" fill="#2563EB" />
    <path d="M12 5l1.5 4.5H18l-3.75 2.75L15.75 17 12 14.25 8.25 17l1.5-4.75L6 9.5h4.5L12 5Z" fill="#FCD34D" />
  </svg>
);

const HistoricalCoatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 6v8c0 4.5 4 7.5 9 9 5-1.5 9-4.5 9-9V6L12 2Z" fill="#92400E" />
    <path d="M12 2L3 6v8c0 4.5 4 7.5 9 9V2Z" fill="#B45309" />
    <path d="M7.5 7h9v7c0 2-2 4-4.5 5-2.5-1-4.5-3-4.5-5V7Z" fill="#D97706" />
    <path d="M12 7v12c-2.5-1-4.5-3-4.5-5V7H12Z" fill="#F59E0B" />
    <path d="M10 10h4M12 8v8" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const FootballTrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="18" width="8" height="2" rx="1" fill="#92400E" />
    <rect x="6" y="20" width="12" height="2" rx="1" fill="#78350F" />
    <rect x="10.5" y="14" width="3" height="4" fill="#D97706" />
    <path d="M6 3h12v7c0 3.5-3 6-6 6s-6-2.5-6-6V3Z" fill="#FBBF24" />
    <path d="M6 3h6v13c-3 0-6-2.5-6-6V3Z" fill="#FCD34D" />
    <path d="M3 4H6v6c0 1-0.5 2-1.5 2.5C2.5 11 2 9.5 2 8V5.5L3 4Z" fill="#F59E0B" />
    <path d="M21 4H18v6c0 1 0.5 2 1.5 2.5C21.5 11 22 9.5 22 8V5.5L21 4Z" fill="#F59E0B" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z" fill="#A855F7" />
    <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16V2Z" fill="#C084FC" />
    <path d="M20 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" fill="#EC4899" />
    <path d="M5 17l0.75 2.25L8 20l-2.25 0.75L5 23l-0.75-2.25L2 20l2.25-0.75L5 17Z" fill="#F472B6" />
  </svg>
);

// ─── Accent tile colors per category ─────────────────────────────────────────

export function visualsForCategoryKind(kind: CategoryKind): CategoryCardVisual {
  switch (kind) {
    case 'country_flags':
      return {
        Icon: CountryFlagIcon,
        accent: 'bg-blue-50 ring-1 ring-inset ring-blue-200',
        chip: 'Sovereign & national',
      };
    case 'autonomy_flags':
      return {
        Icon: AutonomyFlagIcon,
        accent: 'bg-violet-50 ring-1 ring-inset ring-violet-200',
        chip: 'Regions',
      };
    case 'historical_flags':
      return {
        Icon: HistoricalFlagIcon,
        accent: 'bg-amber-50 ring-1 ring-inset ring-amber-200',
        chip: 'Archive',
      };
    case 'organization_flags':
      return {
        Icon: OrganizationFlagIcon,
        accent: 'bg-cyan-50 ring-1 ring-inset ring-cyan-200',
        chip: 'Intergovernmental',
      };
    case 'institution_flags':
      return {
        Icon: InstitutionFlagIcon,
        accent: 'bg-blue-50 ring-1 ring-inset ring-blue-300',
        chip: 'Institutions',
      };
    case 'flag_mockups':
      return {
        Icon: FlagMockupIcon,
        accent: 'bg-orange-50 ring-1 ring-inset ring-orange-200',
        chip: 'Templates',
      };
    case 'flag_videos':
      return {
        Icon: FlagVideoIcon,
        accent: 'bg-red-50 ring-1 ring-inset ring-red-200',
        chip: 'Motion',
      };
    case 'flag_icons':
      return {
        Icon: FlagIconsIcon,
        accent: 'bg-emerald-50 ring-1 ring-inset ring-emerald-200',
        chip: 'Glyph sets',
      };
    case 'country_coats':
      return {
        Icon: CoatOfArmsIcon,
        accent: 'bg-blue-50 ring-1 ring-inset ring-yellow-300',
        chip: 'National emblems',
      };
    case 'historical_coats':
      return {
        Icon: HistoricalCoatIcon,
        accent: 'bg-amber-50 ring-1 ring-inset ring-amber-300',
        chip: 'Historic emblems',
      };
    case 'football_clubs':
      return {
        Icon: FootballTrophyIcon,
        accent: 'bg-yellow-50 ring-1 ring-inset ring-yellow-300',
        chip: 'Club crests',
      };
    case 'other':
      return {
        Icon: SparklesIcon,
        accent: 'bg-purple-50 ring-1 ring-inset ring-purple-200',
        chip: 'Curated',
      };
  }
}
