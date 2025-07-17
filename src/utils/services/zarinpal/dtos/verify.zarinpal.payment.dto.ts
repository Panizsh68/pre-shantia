// verify-zarinpal-payment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class VerifyZarinpalPaymentDto {
  @ApiProperty()
  @IsString()
  authority: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
