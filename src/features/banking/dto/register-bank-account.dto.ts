import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RegisterBankAccountDto {
  @ApiProperty({ example: 'علی رضایی', description: 'نام صاحب حساب مطابق مدارک بانکی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  accountHolderName: string;

  @ApiProperty({ example: '6037991234567890', description: 'شماره کارت ۱۶ رقمی' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9۰-۹٠-٩\s-]{16,23}$/, { message: 'شماره کارت باید ۱۶ رقم باشد.' })
  cardNumber: string;

  @ApiProperty({ example: 'IR820540102680020817909002', description: 'شماره شبا با پیشوند IR' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:IR\s*)?[0-9۰-۹٠-٩\s-]{24,29}$/i, { message: 'شماره شبا باید با IR یا ۲۴ رقم شبا وارد شود.' })
  iban: string;

  @ApiPropertyOptional({ example: 'بانک ملت' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  bankName?: string;
}
