import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class InitiateWalletTopUpDto {
  @ApiProperty({
    description: 'Amount to add to the authenticated owner wallet, in IRR. Zibal requires more than 1,000 IRR.',
    example: 100000,
    minimum: 1001,
  })
  @IsNumber()
  @IsInt()
  @Min(1001)
  @Max(499999999)
  amount: number;
}
