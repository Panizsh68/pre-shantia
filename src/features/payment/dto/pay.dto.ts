import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export type PaymentMethod = 'GATEWAY' | 'WALLET';

export class PayDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ required: false, enum: ['GATEWAY', 'WALLET'], example: 'GATEWAY' })
  @IsOptional()
  @IsIn(['GATEWAY', 'WALLET'])
  method?: PaymentMethod = 'GATEWAY';
}
