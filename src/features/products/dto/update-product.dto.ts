import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the product',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;
}
