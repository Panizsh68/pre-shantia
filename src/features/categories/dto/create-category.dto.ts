import { IsString, IsOptional, IsEnum, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '../enums/category-status.enum';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'The name of the category',
    example: 'سیمان / Cement',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'SEO-friendly unique slug for the category',
    example: 'cement',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Description of the category',
    example: 'دسته‌بندی انواع سیمان برای مصارف ساختمانی / Category for various types of cement for construction.',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'ID of the parent category (if any)',
    example: '507f1f77bcf86cd799439014',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'ID of the company (supplier) owning the category',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    description: 'Status of the category',
    example: 'draft',
    enum: CategoryStatus,
    required: false,
  })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus.DRAFT;
}