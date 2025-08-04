import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'Product ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  productId: string;

  @ApiProperty({ description: 'Rating value (1-5)', example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comment for the rating', example: 'Great product!' })
  @IsString()
  @IsOptional()
  comment?: string;
}
