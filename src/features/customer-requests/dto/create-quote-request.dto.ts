import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateQuoteRequestDto {
  @ApiProperty({ example: 'استعلام قیمت سیمان تیپ ۲' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان درخواست الزامی است.' })
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'سیمان تیپ ۲' })
  @IsString()
  @IsNotEmpty({ message: 'نام محصول الزامی است.' })
  @MaxLength(120)
  productName: string;

  @ApiPropertyOptional({ example: '665f1a2b3c4d5e6f78901234' })
  @IsOptional()
  @IsMongoId({ message: 'شناسه محصول نامعتبر است.' })
  productId?: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt({ message: 'مقدار باید عدد صحیح باشد.' })
  @Min(1, { message: 'مقدار باید بیشتر از صفر باشد.' })
  quantity: number;

  @ApiProperty({ example: 'تن' })
  @IsString()
  @IsNotEmpty({ message: 'واحد درخواست الزامی است.' })
  @MaxLength(80)
  unit: string;

  @ApiProperty({ example: 'شیراز' })
  @IsString()
  @IsNotEmpty({ message: 'محل تحویل الزامی است.' })
  @MaxLength(240)
  deliveryLocation: string;

  @ApiPropertyOptional({ example: 'تحویل مرحله‌ای در دو نوبت انجام شود.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}
