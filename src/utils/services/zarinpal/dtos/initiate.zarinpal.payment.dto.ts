import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateZarinpalPaymentDto {
  @ApiProperty({ description: 'Payment amount in IRR', example: 100000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Callback URL for payment',
    example: 'http://localhost:3000/payment/callback',
  })
  @IsNotEmpty()
  @IsString()
  callbackUrl: string;

  @ApiProperty({ description: 'Payment description', example: 'Payment for order #123' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Mobile number of the payer', example: '09123456789' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ description: 'Email address of the payer', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  userId: string; // اضافه کردن userId
}

export class InitiateZarinpalPaymentResponseDto {
  @ApiProperty({
    description: 'Transaction authority',
    example: 'A00000000000000000000000000000000001',
  })
  authority: string;

  @ApiProperty({
    description: 'Redirect URL for payment',
    example: 'https://zarinpal.com/pg/StartPay/A00000000000000000000000000000000001',
  })
  url: string;
}
