import { Body, Controller, Post, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { CreatePresignDto } from './dto/create-presign.dto';
import { CreatePresignResponseDto } from './dto/presign-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IImageUploadServiceToken, IImageUploadService } from './interfaces/image-upload.service.interface';

@ApiTags('images')
@Controller('images')
export class ImageUploadController {
  constructor(
    @Inject(IImageUploadServiceToken)
    private readonly service: IImageUploadService,
  ) { }

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate presigned URLs for direct file uploads to cloud storage',
    description: `
      This endpoint generates presigned URLs that allow secure direct file uploads from the browser to cloud storage (R2/S3).
      
      **Workflow:**
      1. Frontend calls this endpoint with file metadata (filename, contentType, size)
      2. Backend generates presigned URLs valid for 5 minutes
      3. Frontend uses presignedUrl with PUT request to upload file directly
      4. After successful upload, use publicUrl to reference the file
      
      **Limits:**
      - Product images: max 5 files per request
      - Company images: max 1 file per request
      - Max file size: 10 MB per file
      
      **Important:** ChecksumAlgorithm is disabled to prevent checksum mismatches on browser uploads.
    `,
  })
  @ApiBody({
    type: CreatePresignDto,
    examples: {
      product: {
        summary: 'Product image presign',
        value: {
          type: 'product',
          files: [
            {
              filename: 'product-photo.jpg',
              contentType: 'image/jpeg',
              size: 512000,
            },
          ],
        },
      },
      company: {
        summary: 'Company logo presign',
        value: {
          type: 'company',
          files: [
            {
              filename: 'company-logo.png',
              contentType: 'image/png',
              size: 256000,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URLs generated successfully',
    type: CreatePresignResponseDto,
    schema: {
      example: {
        items: [
          {
            filename: 'product-photo.jpg',
            contentType: 'image/jpeg',
            presignedUrl:
              'https://storage.example.com/product/uuid_product-photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...',
            publicUrl: 'https://cdn.example.com/product/uuid_product-photo.jpg',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file size, type mismatch, or limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - R2/S3 client not configured',
  })
  async presign(@Body() dto: CreatePresignDto): Promise<CreatePresignResponseDto> {
    return this.service.createPresignedUrls(dto);
  }
}
