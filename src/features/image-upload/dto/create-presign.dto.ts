import { IsIn, IsNotEmpty, IsString, IsArray, ArrayMaxSize, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageMetaDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Original filename', example: 'photo.jpg' })
  filename: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'MIME content type', example: 'image/jpeg' })
  contentType: string;

  @IsInt()
  @Min(1)
  // size in bytes
  @ApiProperty({ description: 'File size in bytes', example: 34567 })
  size: number;
}

export class CreatePresignDto {
  @IsIn(['product', 'company'])
  @ApiProperty({ description: 'Type of upload target', enum: ['product', 'company'] })
  type: 'product' | 'company';

  @IsArray()
  @ArrayMaxSize(5)
  @ApiProperty({ description: 'Files to presign', type: [ImageMetaDto] })
  files: ImageMetaDto[];
}
