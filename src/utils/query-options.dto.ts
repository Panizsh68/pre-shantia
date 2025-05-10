import { IsNumber, IsOptional, IsString, Min, IsIn, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryOptionsDto {
  @ApiPropertyOptional({
    description: 'شماره صفحه برای صفحه‌بندی',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'تعداد آیتم‌ها در هر صفحه',
    example: 10,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'فیلدی که برای مرتب‌سازی استفاده می‌شود',
    example: 'name',
    type: String,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'جهت مرتب‌سازی (صعودی یا نزولی)',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'لیست فیلدهای مرتبط برای بارگذاری (پاپیولیت) از دیتابیس',
    example: ['companyId', 'categories'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  populate?: string[];
}