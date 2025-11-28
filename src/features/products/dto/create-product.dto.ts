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
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { ImageMetaDto } from '../../image-upload/dto/create-presign.dto';
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
    description: 'Price modifier for this option (in IRR). Cannot be negative.',
    example: 0,
    minimum: 0
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
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

  @ApiPropertyOptional({
    description: 'Existing image id (ignored on save, kept for compatibility with persisted documents)',
    example: '67480664cb8c0c1c1a9d5a7d',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Existing Mongo _id (ignored on save, kept for compatibility with persisted documents)',
    example: '67480664cb8c0c1c1a9d5a7d',
  })
  @IsOptional()
  @IsString()
  _id?: string;
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

  @ApiPropertyOptional({
    description: 'Discount percentage applied to the product (0-100)',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount?: number;

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
    description: 'Images associated with the product (after upload)',
    type: [ImageDto],
    example: [
      {
        url: 'https://cdn.example.com/product/uuid_cement-bag.jpg',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  @IsOptional()
  images?: ImageDto[];

  @ApiPropertyOptional({
    description:
      'File metadata for requesting presigned URLs (upload preparation stage). Send this array to `POST /images/presign` to receive `presignedUrl` and `publicUrl` for each item. After receiving a presignedUrl, perform a `PUT` to the returned URL using the same `contentType`. Max 5 images per product — if the returned `presignedUrl` is `null` the server performed the upload and you can use the returned `publicUrl` directly.',
    type: [ImageMetaDto],
    example: [
      {
        filename: 'cement-bag.jpg',
        contentType: 'image/jpeg',
        size: 512000,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageMetaDto)
  @IsOptional()
  imagesMeta?: ImageMetaDto[];

  @ApiPropertyOptional({
    description: 'Status of the product',
    enum: ProductStatus,
    example: ProductStatus.DRAFT,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
