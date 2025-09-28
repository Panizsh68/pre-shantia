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
  ) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create presigned URLs for image uploads' })
  @ApiBody({ type: CreatePresignDto })
  @ApiResponse({ status: 200, description: 'Presigned URLs created', type: CreatePresignResponseDto })
  async presign(@Body() dto: CreatePresignDto): Promise<CreatePresignResponseDto> {
    return this.service.createPresignedUrls(dto);
  }
}
