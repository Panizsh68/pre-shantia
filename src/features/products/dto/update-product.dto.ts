import { OmitType, PartialType } from '@nestjs/mapped-types';
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
  Max,
  IsEnum
} from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { ProductStatus } from '../enums/product-status.enum';

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

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description: 'Stock update information',
    type: UpdateStockDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateStockDto)
  stock?: UpdateStockDto;

  @ApiPropertyOptional({
    description: 'Status of the product',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
