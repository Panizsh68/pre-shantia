export type ProcessRefundZarinpalType = {
  sessionId: string;

  amount: number;

  description: string;

  method: string;

  reason: string;
}

export type RefundTransactionResponseType = {

  authority: string;

  status: string;

  refund_status?: string;

  refund_amount?: number;
}

export type ProcessRefundZarinpalResponseType = {
  refundId: string;

  amount: number;

  status: string;

  transaction: RefundTransactionResponseType;
}
