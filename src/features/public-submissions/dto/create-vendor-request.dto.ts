import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVendorRequestDto {
  @ApiProperty({ description: 'Company or business name', example: 'شرکت تجاریس' })
  @IsNotEmpty({ message: 'نام شرکت نمی‌تواند خالی باشد' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'Contact email', example: 'contact@company.com' })
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  @IsEmail(undefined, { message: 'ایمیل نامعتبر است' })
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '09123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'National registration number', example: '10002110222' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'National ID or business national identifier', example: '1234567891' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Company address', example: 'شیراز، خیابان...' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Optional image URL for the business logo or document', example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
