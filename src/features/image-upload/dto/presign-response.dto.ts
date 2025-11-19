import { ApiProperty } from '@nestjs/swagger';

export class PresignItemDto {
  @ApiProperty({
    description: 'Original filename as provided in request',
    example: 'product-photo.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'MIME content type of the file',
    example: 'image/jpeg',
  })
  contentType: string;

  @ApiProperty({
    description:
      'AWS presigned URL for direct PUT upload. Valid for 5 minutes. Include Content-Type header in PUT request.',
    example:
      'https://storage.example.com/product/uuid_product.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=300&X-Amz-Signature=...&X-Amz-SignedHeaders=host&x-id=PutObject',
  })
  presignedUrl: string;

  @ApiProperty({
    description:
      'Public CDN URL to access the uploaded file after successful PUT upload. Use this in your application.',
    example: 'https://cdn.example.com/product/uuid_product.jpg',
  })
  publicUrl: string;
}

export class CreatePresignResponseDto {
  @ApiProperty({
    type: [PresignItemDto],
    description: 'Array of presigned URL items, one per requested file',
  })
  items: PresignItemDto[];
}
