// process-refund-zarinpal.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class ProcessRefundZarinpalDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  method: string;

  @ApiProperty()
  @IsString()
  reason: string;
}
