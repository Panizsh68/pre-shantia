export type InitiateZarinpalPaymentType = {
  amount: number;
  callbackUrl: string;
  description: string;
  mobile?: string;
  email?: string;
  userId: string;
  orderId: string;
};

export type InitiateZarinpalPaymentResponseType = {
  authority: string;
  url: string;
};
