import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the category',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;
}
