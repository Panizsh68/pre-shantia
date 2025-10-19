import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class UpdateProductStatusDto {
  @ApiProperty({ enum: ProductStatus, description: 'New status for the product' })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}
