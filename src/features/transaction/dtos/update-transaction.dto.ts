import { RefundStatus } from '../enums/refund.status.enum';
import { TransactionStatus } from '../enums/transaction.status.enum';

interface InquireResult {
  [key: string]: unknown;
}

export class UpdateTransactionDto {
  amount?: number;
  description?: string;
  mobile?: string;
  email?: string;
  status?: TransactionStatus;
  verifiedAt?: Date;
  ref_id?: string;
  refund_status?: RefundStatus;
  refund_id?: string;
  refund_amount?: number;
  refund_reason?: string;
  refundedAt?: Date;
  inquire_result?: InquireResult;
  inquiredAt?: Date;
}
