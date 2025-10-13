import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateOrderFromCartDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsObject()
  perCompany?: Record<string, any> | Array<any>;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
