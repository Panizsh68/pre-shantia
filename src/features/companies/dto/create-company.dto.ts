import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsEnum,
  IsUrl,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImageMetaDto } from '../../image-upload/dto/create-presign.dto';
import { SellerType } from '../enums/seller-type.enum';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Name of the company',
    example: 'Tech Innovations Inc.',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SellerType, description: 'Legal or individual seller type' })
  @IsNotEmpty({ message: 'نوع شرکت الزامی است.' })
  @IsEnum(SellerType, { message: 'نوع شرکت نامعتبر است.' })
  sellerType: SellerType;

  @ApiProperty({
    description: 'Email address of the company',
    example: 'info@techinnovations.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number of the company',
    example: '+982123456789',
  })
  @IsNotEmpty({ message: 'شماره تماس الزامی است.' })
  @IsPhoneNumber('IR', { message: 'شماره تماس نامعتبر است.' })
  phone: string;

  @ApiPropertyOptional({
    description: 'Registration number of the company',
    example: '1234567890',
  })
  @ValidateIf((company) => company.sellerType === SellerType.LEGAL)
  @IsNotEmpty({ message: 'شماره ثبت برای شخص حقوقی الزامی است.' })
  @IsString({ message: 'شماره ثبت نامعتبر است.' })
  registrationNumber?: string;

  @ApiProperty({
    description: 'Address of the company',
    example: 'Tehran, Iran',
  })
  @IsNotEmpty({ message: 'آدرس دفتر مرکزی الزامی است.' })
  @IsString({ message: 'آدرس دفتر مرکزی نامعتبر است.' })
  address: string;

  @ApiPropertyOptional({
    description:
      'File metadata for requesting a presigned URL. Call `POST /images/presign` with `type: "company"` and this object in the `files` array to receive `presignedUrl` and `publicUrl`. After receiving the presignedUrl, perform a `PUT` using the same `contentType`. Only 1 image per company. If `presignedUrl` is `null`, the backend uploaded the file server-side and you should use the returned `publicUrl`.',
    type: ImageMetaDto,
    example: {
      filename: 'company-logo.png',
      contentType: 'image/png',
      size: 256000,
    },
  })
  @ValidateNested()
  @Type(() => ImageMetaDto)
  @ValidateIf((company) => !company.image)
  imageMeta?: ImageMetaDto;

  @ApiPropertyOptional({
    description: 'Public URL of an already uploaded company logo',
    example: 'https://cdn.example.com/company/logo.png',
  })
  @ValidateIf((company) => Boolean(company.image))
  @IsUrl({ require_protocol: true }, { message: 'آدرس لوگوی شرکت نامعتبر است.' })
  image?: string;

  @ApiProperty({
    description: 'National ID (company national identifier)',
    example: '0123456789',
  })
  @IsNotEmpty({ message: 'کد ملی یا شناسه ملی الزامی است.' })
  @IsString({ message: 'کد ملی یا شناسه ملی نامعتبر است.' })
  @Transform(({ value }) => String(value ?? '').replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776)))
  @Matches(/^[0-9]{10}$/, { message: 'شناسه ملی یا کد ملی باید ۱۰ رقم باشد.' })
  nationalId: string;
}
