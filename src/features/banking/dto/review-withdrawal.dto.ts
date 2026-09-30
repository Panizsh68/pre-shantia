import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { WithdrawalStatus } from '../enums/withdrawal-status.enum';

export class ReviewWithdrawalDto {
  @ApiProperty({ enum: [WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED, WithdrawalStatus.PAID] })
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ValidateIf((value: ReviewWithdrawalDto) => value.status === WithdrawalStatus.REJECTED)
  @IsNotEmpty()
  rejectionReason?: string;
}
