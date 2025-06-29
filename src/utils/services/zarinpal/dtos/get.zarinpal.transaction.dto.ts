import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetTransactionsZarinpalDto {
  @ApiProperty({
    description: 'Zarinpal terminal ID',
    example: 'a3c16110-f184-44e2-ad26-649387845a94',
  })
  @IsNotEmpty()
  @IsString()
  terminalId: string;

  @ApiPropertyOptional({ description: 'Filter for transactions', example: 'all' })
  @IsOptional()
  @IsString()
  filter: string;

  @ApiProperty({ description: 'Offset for pagination', example: 0 })
  @IsNotEmpty()
  @IsNumber()
  offset: number;

  @ApiProperty({ description: 'Limit for pagination', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  limit: number;
}

export class TransactionResponse {
  @ApiProperty({
    description: 'Transaction authority',
    example: 'A00000000000000000000000000000000001',
  })
  authority: string;

  @ApiProperty({ description: 'Transaction amount in IRR', example: 100000 })
  amount: number;

  @ApiProperty({ description: 'Transaction status from Zarinpal', example: '100' })
  status: string;

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

export class GetTransactionsZarinpalResponseDto {
  @ApiProperty({ description: 'List of transactions', type: [TransactionResponse] })
  transactions: TransactionResponse[];

  @ApiProperty({ description: 'Total number of transactions', example: 100 })
  total: number;

  @ApiProperty({ description: 'Pagination offset', example: 0 })
  offset: number;

  @ApiProperty({ description: 'Pagination limit', example: 10 })
  limit: number;
}
