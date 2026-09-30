import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { BankAccountStatus } from '../enums/bank-account-status.enum';

export class ReviewBankAccountDto {
  @ApiProperty({ enum: [BankAccountStatus.APPROVED, BankAccountStatus.REJECTED] })
  @IsEnum(BankAccountStatus)
  status: BankAccountStatus;

  @ApiProperty({ required: false, description: 'برای رد حساب بانکی الزامی است' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ValidateIf((value: ReviewBankAccountDto) => value.status === BankAccountStatus.REJECTED)
  @IsNotEmpty()
  rejectionReason?: string;
}
