import type { ISODateString } from './common';

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  /** Set when authenticated; mock/demo may omit */
  userId: string | null;
  /** Anonymous cart correlation (cookie), not implemented yet */
  sessionId: string | null;
  lines: CartLine[];
  updatedAt: ISODateString;
}
