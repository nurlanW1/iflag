import type { ISODateString } from './common';

/**
 * Top-level taxonomy. "Other" categories require explicit approval in admin (future).
 */
export type CategoryKind =
  | 'country_flags'
  | 'autonomy_flags'
  | 'historical_flags'
  | 'organization_flags'
  | 'institution_flags'
  | 'flag_mockups'
  | 'flag_videos'
  | 'flag_icons'
  | 'country_coats'
  | 'historical_coats'
  | 'football_clubs'
  | 'other';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: CategoryKind;
  /** Self-service "other" categories stay false until approved */
  isApproved: boolean;
  parentId: string | null;
  displayOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
