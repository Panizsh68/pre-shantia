export interface VerifyZibalPaymentRequestType {
  trackId: string | number;
  amount?: number;
}

export interface VerifyZibalPaymentResponseType {
  result?: number | string; // SDK might use result or status
  status?: number | string;
  refNumber?: string;
  ref_id?: string;
  paidAt?: string;
  amount?: number;
  raw?: unknown;
}
