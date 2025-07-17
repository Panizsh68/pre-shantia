export type VerifyZarinpalPaymentRequestType = {
  authority: string;
  amount: number;
};

export type VerifyZarinpalPaymentResponseType = {
  authority: string;
  ref_id: string;
  status: string;
};
