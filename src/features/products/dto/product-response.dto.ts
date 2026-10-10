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

class CompanySummaryDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
}

class CategorySummaryDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
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

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' } } }] })
  companyId: string | CompanySummaryDto;

  @ApiProperty({ type: 'array', items: { oneOf: [{ type: 'string' }, { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' } } }] } })
  categories: Array<string | CategorySummaryDto>;

  @ApiPropertyOptional({ example: 'IRR' })
  currency?: string;

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

  @ApiPropertyOptional({ description: 'Quantity sold in successful orders; present in best-selling results.' })
  totalSold?: number;

  @ApiPropertyOptional({ description: 'Average customer rating; present in popular results.' })
  avgRate?: number;

  @ApiPropertyOptional({ description: 'Number of customer ratings; present in popular results.' })
  totalRatings?: number;
}
