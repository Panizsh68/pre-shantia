import { IsIn, IsNotEmpty, IsString, IsArray, ArrayMaxSize, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageMetaDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Original filename (without path)',
    example: 'product-photo.jpg',
  })
  filename: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'MIME content type of the file',
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })
  contentType: string;

  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'File size in bytes (0 allowed when size is unknown)',
    example: 512000,
    minimum: 0,
  })
  size: number;
}

export class CreatePresignDto {
  @IsIn(['product', 'company'])
  @ApiProperty({
    description: 'Upload target type (determines storage path and limits)',
    enum: ['product', 'company'],
    example: 'product',
  })
  type: 'product' | 'company';

  @IsArray()
  @ArrayMaxSize(5)
  @ApiProperty({
    type: [ImageMetaDto],
    description:
      'Array of files to presign. Max 5 for products, max 1 for companies. Max 10MB per file.',
    maxItems: 5,
  })
  files: ImageMetaDto[];
}
