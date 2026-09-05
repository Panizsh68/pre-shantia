import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Order id to pay for' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Expected order total amount (IRR)' })
  @IsNumber()
  @IsInt()
  @Min(1001)
  @Max(499999999)
  amount: number;
}
