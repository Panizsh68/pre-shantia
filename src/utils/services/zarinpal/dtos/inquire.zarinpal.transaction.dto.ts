import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InquireZarinpalTransactionDto {
  @ApiProperty({
    description: 'Transaction authority',
    example: 'A00000000000000000000000000000000001',
  })
  @IsNotEmpty()
  @IsString()
  authority: string;
}

export class InquireZarinpalTransactionResponseDto {
  @ApiProperty({
    description: 'Transaction authority',
    example: 'A00000000000000000000000000000000001',
  })
  authority: string;

  @ApiProperty({ description: 'Transaction status from Zarinpal', example: '100' })
  status: string;

  @ApiProperty({ description: 'Transaction amount in IRR', example: 100000 })
  amount: number;

  @ApiProperty({ description: 'Reference ID from Zarinpal', example: '123456789', required: false })
  ref_id?: string;

  @ApiProperty({
    description: 'Transaction status from database',
    example: 'completed',
    required: false,
  })
  db_status?: string;

  @ApiProperty({
    description: 'Refund status from database',
    example: 'completed',
    required: false,
  })
  refund_status?: string;

  @ApiProperty({ description: 'Refund amount in IRR', example: 50000, required: false })
  refund_amount?: number;

  [key: string]: string | number | undefined;
}
