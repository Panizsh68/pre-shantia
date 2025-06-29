import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyZarinpalPaymentDto {
  @ApiProperty({
    description: 'Transaction authority',
    example: 'A00000000000000000000000000000000001',
  })
  @IsNotEmpty()
  @IsString()
  authority: string;

  @ApiProperty({ description: 'Transaction amount in IRR', example: 100000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
