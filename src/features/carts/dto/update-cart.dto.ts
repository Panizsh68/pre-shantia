import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateCartDto } from './create-cart.dto';

export class UpdateCartDto extends PartialType(CreateCartDto) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the cart',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;
}
