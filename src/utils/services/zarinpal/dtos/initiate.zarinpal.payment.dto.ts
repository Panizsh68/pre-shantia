// initiate-payment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEmail, IsUrl } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsUrl()
  callbackUrl: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  orderId: string;
}

export class InitiatePaymentResponseDto {
  @ApiProperty({ example: 'A00000000000000000000000000123456789' })
  authority: string;

  @ApiProperty({
    example: 'https://www.zarinpal.com/pg/StartPay/A00000000000000000000000000123456789',
  })
  redirectUrl: string;
}
