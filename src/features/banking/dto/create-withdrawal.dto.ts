import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  bankAccountId: string;

  @ApiProperty({ example: 500000, description: 'مبلغ به ریال' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'برداشت بابت تسویه حساب' })
  @IsString()
  @IsOptional()
  @MaxLength(240)
  description?: string;
}
