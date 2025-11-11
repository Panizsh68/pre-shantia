import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsObject,
  IsMongoId,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '../enums/discount-type.enum';
import { Type } from 'class-transformer';

export class DiscountDto {
  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ description: 'Value of discount (percentage 0-100 or fixed amount in IRR)', example: 10 })
  @IsNumber()
  value: number;
}

export class CartItemDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the product',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the supplier company',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  companyId: string;

  @ApiProperty({
    description: 'Quantity of the product in the cart',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Price of the product at the time of adding to cart (in IRR)',
    example: 2000000,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceAtAdd: number;

  @ApiPropertyOptional({
    description: 'Selected variant of the product (e.g., size, packaging)',
    example: { name: 'Packaging', value: '50 kg' },
  })
  @IsOptional()
  @IsObject()
  variant?: { name: string; value: string };

  @ApiPropertyOptional({
    description: 'Optional discount applied to this cart item',
    example: { type: DiscountType.PERCENTAGE, value: 10 },
    type: DiscountDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto;
}
