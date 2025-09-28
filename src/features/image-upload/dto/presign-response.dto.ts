import { ApiProperty } from '@nestjs/swagger';

export class PresignItemDto {
  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'MIME content type' })
  contentType: string;

  @ApiProperty({ description: 'Presigned URL to upload the file' })
  presignedUrl: string;

  @ApiProperty({ description: 'Public URL to access the uploaded file' })
  publicUrl: string;
}

export class CreatePresignResponseDto {
  @ApiProperty({ type: [PresignItemDto] })
  items: PresignItemDto[];
}
