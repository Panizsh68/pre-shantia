import { Module } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { ImageUploadController } from './image-upload.controller';
import { S3ClientProvider } from './providers/s3.client.provider';
import { IImageUploadServiceToken } from './interfaces/image-upload.service.interface';

@Module({
  providers: [S3ClientProvider, { provide: IImageUploadServiceToken, useClass: ImageUploadService }],
  controllers: [ImageUploadController],
  exports: [IImageUploadServiceToken],
})
export class ImageUploadModule { }
