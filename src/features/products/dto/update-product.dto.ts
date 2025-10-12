import { OmitType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  IsMongoId,
  Min,
  Max
} from 'class-validator';
import { CreateProductDto } from './create-product.dto';

// Stock validation for update
class UpdateStockDto {
  @ApiProperty({
    description: 'New quantity in stock',
    example: 500,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class UpdateProductDto extends OmitType(CreateProductDto, [
  'sku', // SKU should not be updatable
  'slug', // Slug should not be updatable
  'stock' // We'll use our custom stock DTO
] as const) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the product',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;

  @ApiPropertyOptional({
    description: 'Stock update information',
    type: UpdateStockDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateStockDto)
  stock?: UpdateStockDto;
}
