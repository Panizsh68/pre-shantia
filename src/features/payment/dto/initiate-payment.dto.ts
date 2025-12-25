import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Order id to pay for' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Expected order total amount (IRR)' })
  @IsNumber()
  amount: number;
}
