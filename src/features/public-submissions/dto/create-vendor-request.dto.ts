import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUrl, Matches, MaxLength, ValidateIf } from 'class-validator';
import { SellerType } from '../../companies/enums/seller-type.enum';

const normalizeDigits = ({ value }: { value: unknown }) => String(value ?? '')
  .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));

export class CreateVendorRequestDto {
  @ApiProperty({ description: 'Company or business name', example: 'شرکت تجاریس' })
  @IsNotEmpty({ message: 'نام شرکت نمی‌تواند خالی باشد' })
  @IsString()
  companyName: string;

  @ApiProperty({ enum: SellerType, description: 'Legal or individual seller type' })
  @IsNotEmpty({ message: 'نوع تأمین‌کننده الزامی است.' })
  @IsEnum(SellerType, { message: 'نوع تأمین‌کننده نامعتبر است.' })
  sellerType: SellerType;

  @ApiProperty({ description: 'Contact email', example: 'contact@company.com' })
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  @IsEmail(undefined, { message: 'ایمیل نامعتبر است' })
  email: string;

  @ApiProperty({ description: 'Contact phone number', example: '09123456789' })
  @IsNotEmpty({ message: 'شماره تماس الزامی است.' })
  @IsString({ message: 'شماره تماس نامعتبر است.' })
  @Matches(/^[0-9۰-۹+()\-\s]{7,15}$/, { message: 'شماره تماس را با قالب معتبر وارد کنید.' })
  phone: string;

  @ApiPropertyOptional({ description: 'National registration number', example: '10002110222' })
  @ValidateIf((request) => request.sellerType === SellerType.LEGAL)
  @IsNotEmpty({ message: 'شماره ثبت برای شخص حقوقی الزامی است.' })
  @IsString({ message: 'شماره ثبت نامعتبر است.' })
  registrationNumber?: string;

  @ApiProperty({ description: 'National ID or business national identifier', example: '1234567891' })
  @IsNotEmpty({ message: 'کد ملی یا شناسه ملی الزامی است.' })
  @IsString({ message: 'کد ملی یا شناسه ملی نامعتبر است.' })
  @Matches(/^[0-9]{10}$/, { message: 'شناسه ملی یا کد ملی باید ۱۰ رقم باشد.' })
  @Transform(normalizeDigits)
  nationalId: string;

  @ApiProperty({ description: 'Company address', example: 'شیراز، خیابان...' })
  @IsNotEmpty({ message: 'آدرس دفتر مرکزی الزامی است.' })
  @IsString({ message: 'آدرس دفتر مرکزی نامعتبر است.' })
  @MaxLength(500, { message: 'آدرس نمی‌تواند بیشتر از ۵۰۰ نویسه باشد.' })
  address: string;

  @ApiProperty({ description: 'Public image URL for the business logo', example: 'https://cdn.example.com/logo.png' })
  @IsNotEmpty({ message: 'لوگو یا تصویر کسب‌وکار الزامی است.' })
  @IsUrl({ require_protocol: true }, { message: 'آدرس لوگو نامعتبر است.' })
  imageUrl: string;
}
