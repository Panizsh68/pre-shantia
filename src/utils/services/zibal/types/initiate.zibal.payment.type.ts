export interface InitiateZibalPaymentType {
  amount: number;
  callbackUrl?: string;
  description?: string;
  email?: string;
  mobile?: string;
  userId?: string;
  orderId?: string;
}

export interface InitiateZibalPaymentResponseType {
  trackId: string; // zibal track id
  paymentUrl: string;
  raw?: unknown;
}
