import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'گزارش اطلاعات نادرست محصول' })
  @IsString()
  @IsNotEmpty({ message: 'موضوع گزارش الزامی است.' })
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'اطلاعات این محصول با محتوای درج‌شده مطابقت ندارد.' })
  @IsString()
  @IsNotEmpty({ message: 'شرح گزارش الزامی است.' })
  @MinLength(10, { message: 'شرح گزارش باید حداقل ۱۰ نویسه باشد.' })
  @MaxLength(4000)
  description: string;

  @ApiProperty({ example: 'علی رضایی' })
  @IsString()
  @IsNotEmpty({ message: 'نام گزارش‌دهنده الزامی است.' })
  @MaxLength(160)
  reporterName: string;

  @ApiProperty({ example: 'ali@example.com' })
  @IsEmail(undefined, { message: 'ایمیل گزارش‌دهنده معتبر نیست.' })
  reporterEmail: string;

  @ApiPropertyOptional({ example: 'https://tejaris.ir/products/123' })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'لینک مورد گزارش معتبر نیست.' })
  @MaxLength(2048)
  targetUrl?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetReference?: string;
}
