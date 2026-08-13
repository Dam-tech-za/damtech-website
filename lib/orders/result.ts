import type { OrderEmailStatus } from "./types.ts";

export type PublicOrderSuccess = {
  success: true;
  orderReference: string;
  viewToken: string;
  email: string;
  productName: string;
  quantity: number;
  totalInclVatZar: number;
  confirmationEmailStatus: OrderEmailStatus;
  internalEmailStatus: OrderEmailStatus;
};

/** Customer-facing success after the order row exists. Email failure must not discard it. */
export function publicOrderSuccess(input: {
  orderReference: string;
  viewToken: string;
  email: string;
  productName: string;
  quantity: number;
  totalInclVatZar: number;
  confirmationEmailStatus: OrderEmailStatus;
  internalEmailStatus: OrderEmailStatus;
}): PublicOrderSuccess {
  return {
    success: true,
    ...input,
  };
}
