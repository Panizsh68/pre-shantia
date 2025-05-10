import { IsString, IsNumber, IsArray, IsOptional, Min, IsEnum, IsObject, ValidateNested, IsUrl, Max, MaxLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../enums/product-status.enum';

class StockDto {
  @ApiProperty({
    description: 'مقدار موجودی محصول در انبار (مثلاً تعداد کیسه یا تن)',
    example: 500,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}

class VariantOptionDto {
  @ApiProperty({
    description: 'مقدار گزینه تنوع محصول (مثلاً اندازه بسته‌بندی)',
    example: '50 کیلوگرم',
    type: String,
  })
  @IsString()
  value: string;

  @ApiProperty({
    description: 'تغییر قیمت برای این گزینه (به ریال)',
    example: 0,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  priceModifier?: number;
}

class VariantDto {
  @ApiProperty({
    description: 'نام تنوع محصول (مثلاً بسته‌بندی، گرید)',
    example: 'بسته‌بندی',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'لیست گزینه‌های تنوع محصول',
    example: [
      { value: '50 کیلوگرم', priceModifier: 0 },
      { value: '1 تن', priceModifier: 500000 },
    ],
    type: [VariantOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionDto)
  options: VariantOptionDto[];
}

class ImageDto {
  @ApiProperty({
    description: 'آدرس URL تصویر محصول',
    example: 'https://example.com/cement-bag.jpg',
    type: String,
  })
  @IsUrl()
  url: string;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'نام محصول (مثلاً نوع مصالح ساختمانی)',
    example: 'سیمان تیپ ۲',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'شناسه یکتا و مناسب برای SEO محصول',
    example: 'simaan-tip-2',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'کد واحد نگهداری موجودی (SKU) برای ردیابی انبار',
    example: 'SIM-T2-001',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'قیمت پایه محصول به ازای هر واحد (به ریال)',
    example: 2000000,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'شناسه شرکت (تأمین‌کننده) ارائه‌دهنده محصول',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    description: 'لیست شناسه‌های دسته‌بندی‌های مرتبط با محصول',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({
    description: 'توضیحات محصول',
    example: 'سیمان تیپ ۲ با مقاومت بالا برای سازه‌های بتنی',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'اطلاعات موجودی محصول',
    example: { quantity: 500 },
    type: StockDto,
  })
  @ValidateNested()
  @Type(() => StockDto)
  @IsNotEmpty()
  stock: StockDto;

  @ApiProperty({
    description: 'تنوع‌های محصول (مثلاً اندازه بسته‌بندی، گرید)',
    example: [
      {
        name: 'بسته‌بندی',
        options: [
          { value: '50 کیلوگرم', priceModifier: 0 },
          { value: '1 تن', priceModifier: 500000 },
        ],
      },
    ],
    type: [VariantDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsOptional()
  variants?: VariantDto[];

  @ApiProperty({
    description: 'ویژگی‌های سفارشی محصول',
    example: { 'استحکام': '42.5 مگاپاسکال', 'زمان گیرش': '3 ساعت' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @ApiProperty({
    description: 'برچسب‌ها برای فیلتر و جستجو',
    example: ['سیمان', 'مصالح ساختمانی'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'تصاویر مرتبط با محصول',
    example: [{ url: 'https://example.com/cement-bag.jpg' }],
    type: [ImageDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  @IsOptional()
  images?: ImageDto[];

  @ApiProperty({
    description: 'زیرمجموعه محصول',
    example: 'سیمان پرتلند',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({
    description: 'نظرات کاربران درباره محصول',
    example: ['کیفیت عالی!', 'تحویل سریع'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  comments?: string[];

  @ApiProperty({
    description: 'امتیاز متوسط محصول (از 1 تا 5)',
    example: 4.5,
    type: Number,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'وضعیت محصول',
    example: 'draft',
    enum: ProductStatus,
    required: false,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}