/** Shared primitives for marketplace domain types */

export type ISODateString = string;

export type CurrencyCode = 'USD' | 'EUR' | string;

export interface Money {
  amountCents: number;
  currency: CurrencyCode;
}
