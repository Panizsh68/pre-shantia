import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../enums/product-status.enum';

class StockDto {
  @ApiProperty({ example: 500 })
  quantity: number;
}

class VariantOptionDto {
  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  priceModifier?: number;
}

class VariantDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: [VariantOptionDto] })
  options: VariantOptionDto[];
}

class ImageDto {
  @ApiProperty()
  url: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  basePrice: number;

  @ApiPropertyOptional()
  discount?: number;

  @ApiProperty()
  companyId: string;

  @ApiProperty({ type: [String] })
  categories: string[];

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: StockDto })
  stock: StockDto;

  @ApiPropertyOptional({ type: [VariantDto] })
  variants?: VariantDto[];

  @ApiPropertyOptional({ type: Object })
  attributes?: Record<string, string>;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ type: [ImageDto] })
  images?: ImageDto[];

  @ApiPropertyOptional({ type: [String] })
  comments?: string[];

  @ApiPropertyOptional()
  rating?: number;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiPropertyOptional()
  deletedAt?: Date;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  finalPrice?: number;
}
