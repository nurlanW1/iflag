import type { ISODateString } from './common';

/**
 * Minimal user shape for foundation (no credentials / auth flows).
 */
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
