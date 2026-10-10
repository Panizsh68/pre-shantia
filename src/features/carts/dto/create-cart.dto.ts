import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  Min,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartStatus } from '../enums/cart-status.enum';
import { CartItemDto } from './cart-item.dto';

export class CreateCartDto {
  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the user owning the cart. The authenticated user is used by the controller.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: 'List of items in the cart',
    type: [CartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiPropertyOptional({
    description: 'Total amount of the cart (in IRR)',
    example: 4000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Status of the cart',
    enum: CartStatus,
    example: CartStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CartStatus)
  status?: CartStatus;
}
