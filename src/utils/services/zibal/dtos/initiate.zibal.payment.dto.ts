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
  @ApiProperty({ example: '1533727744287' })
  trackId: string;

  @ApiProperty({ example: 'https://zibal.ir/pg/StartPay/1533727744287' })
  paymentUrl: string;
}
