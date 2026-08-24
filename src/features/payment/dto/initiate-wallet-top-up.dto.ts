import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';

export class InitiateWalletTopUpDto {
  @ApiProperty({
    description: 'Amount to add to the authenticated owner wallet, in IRR. Zibal requires more than 1,000 IRR.',
    example: 100000,
    minimum: 1001,
  })
  @IsNumber()
  @IsInt()
  @Min(1001)
  amount: number;
}
