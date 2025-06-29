import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessRefundZarinpalDto {
  @ApiProperty({
    description: 'Transaction authority',
    example: 'A00000000000000000000000000000000001',
  })
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Refund amount in IRR', example: 50000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Refund description', example: 'Refund for order #123' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Refund method', example: 'bank_account' })
  @IsNotEmpty()
  @IsString()
  method: string;

  @ApiProperty({ description: 'Reason for refund', example: 'Customer requested refund' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class RefundTransactionResponse {
  @ApiProperty({
    description: 'Transaction authority',
    example: 'A00000000000000000000000000000000001',
  })
  authority: string;

  @ApiProperty({ description: 'Transaction status', example: 'refunded' })
  status: string;

  @ApiProperty({ description: 'Refund status', example: 'completed', required: false })
  refund_status?: string;

  @ApiProperty({ description: 'Refund amount in IRR', example: 50000, required: false })
  refund_amount?: number;
}

export class ProcessRefundZarinpalResponseDto {
  @ApiProperty({ description: 'Refund ID from Zarinpal', example: 'R123456' })
  refundId: string;

  @ApiProperty({ description: 'Refund amount in IRR', example: 50000 })
  amount: number;

  @ApiProperty({ description: 'Refund status from Zarinpal', example: 'completed' })
  status: string;

  @ApiProperty({ description: 'Transaction details', type: RefundTransactionResponse })
  transaction: RefundTransactionResponse;
}
