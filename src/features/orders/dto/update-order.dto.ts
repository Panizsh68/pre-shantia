import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the order',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;
}
