import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '../enums/category-status.enum';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Cement',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'SEO-friendly unique slug for the category',
    example: 'cement',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    description: 'Description of the category',
    example: 'Category for various types of cement',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the parent category',
    example: '507f1f77bcf86cd799439014',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the supplier company',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({
    description: 'Status of the category',
    enum: CategoryStatus,
    example: CategoryStatus.DRAFT,
  })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;
}
