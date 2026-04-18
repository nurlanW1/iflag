import type { ISODateString } from './common';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: ISODateString;
}
