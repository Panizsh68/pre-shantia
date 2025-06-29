import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  IsEnum,
  IsObject,
  ValidateNested,
  IsUrl,
  Max,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../enums/product-status.enum';

class StockDto {
  @ApiProperty({
    description: 'Quantity of product in stock',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}

class VariantOptionDto {
  @ApiProperty({
    description: 'Value of the variant option',
    example: '50 kg',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({
    description: 'Price modifier for this option (in IRR)',
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  priceModifier?: number;
}

class VariantDto {
  @ApiProperty({
    description: 'Name of the variant',
    example: 'Packaging',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'List of variant options',
    type: [VariantOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionDto)
  options: VariantOptionDto[];
}

class ImageDto {
  @ApiProperty({
    description: 'URL of the product image',
    example: 'https://example.com/cement-bag.jpg',
  })
  @IsUrl()
  url: string;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'Cement Type 2',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'SEO-friendly unique slug for the product',
    example: 'cement-type-2',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (SKU) code',
    example: 'CEM-T2-001',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'Base price of the product (in IRR)',
    example: 2000000,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'MongoDB ObjectId of the supplier company',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({
    description: 'List of category IDs',
    example: ['507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Description of the product',
    example: 'High-strength Type 2 cement for concrete structures',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Stock information for the product',
    type: StockDto,
  })
  @ValidateNested()
  @Type(() => StockDto)
  @IsNotEmpty()
  stock: StockDto;

  @ApiPropertyOptional({
    description: 'Product variants',
    type: [VariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsOptional()
  variants?: VariantDto[];

  @ApiPropertyOptional({
    description: 'Custom attributes of the product',
    example: { strength: '42.5 MPa', settingTime: '3 hours' },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Tags for filtering and search',
    example: ['cement', 'construction'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Images associated with the product',
    type: [ImageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  @IsOptional()
  images?: ImageDto[];

  @ApiPropertyOptional({
    description: 'User comments about the product',
    example: ['Great quality!', 'Fast delivery'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  comments?: string[];

  @ApiPropertyOptional({
    description: 'Average rating of the product (1 to 5)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Status of the product',
    enum: ProductStatus,
    example: ProductStatus.DRAFT,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
