import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrdersStatus } from '../enums/orders.status.enum';

class OrderItemDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the product',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'List of order items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Total price of the order (in IRR)',
    example: 1500000,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiProperty({
    description: 'Status of the order',
    enum: OrdersStatus,
    example: OrdersStatus.PENDING,
  })
  @IsNotEmpty()
  @IsEnum(OrdersStatus)
  status: OrdersStatus;

  @ApiPropertyOptional({
    description: 'Shipping address for the order',
    example: '123 Street, Tehran, Iran',
  })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({
    description: 'Payment method used for the order',
    example: 'Credit Card',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the supplier company',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  companyId: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the transport record',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  transportId?: string;
}
