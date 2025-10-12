export interface ProcessRefundZibalType {
  sessionId: string;
  amount: number;
  description?: string;
  method?: string;
  reason?: string;
}

export interface ProcessRefundZibalResponseType {
  result: number;
  message?: string;
}
