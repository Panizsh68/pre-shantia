import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateProductDto } from "src/features/products/dto/create-product.dto";
import { OrdersStatus } from "../enums/orders.status.enum";

export class OrderItemDto {
    @ApiProperty({ example: "product123" })
    @IsNotEmpty()
    @IsString()
    productId: string;

    @ApiProperty({ example: 2 })
    @IsNotEmpty()
    @IsNumber()
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({ example: "user123" })
    @IsNotEmpty()
    @IsString()
    userId: string;
  
    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({ example: 1500 })
    @IsNotEmpty()
    @IsNumber()
    totalPrice: number;  // Renamed for consistency

    @ApiProperty({ example: "PENDING", enum: OrdersStatus })
    @IsNotEmpty()
    status: OrdersStatus;  // Added for consistency

    @ApiProperty({ example: "123 Street, Tehran, Iran" })
    @IsOptional()
    @IsString()
    shippingAddress?: string;  // Added for consistency

    @ApiProperty({ example: "Credit Card" })
    @IsOptional()
    @IsString()
    paymentMethod?: string;  // Added for consistency

    @ApiProperty({ example: "company123" })
    @IsNotEmpty()
    @IsString()
    companyId: string;  // Added for consistency

    @ApiProperty({ example: "transport456" })
    @IsOptional()
    @IsString()
    transportId?: string;  // Added for consistency
}
