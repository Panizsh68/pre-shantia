import { Module } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { ImageUploadController } from './image-upload.controller';
import { S3ClientProvider } from './providers/s3.client.provider';
import { IImageUploadServiceToken } from './interfaces/image-upload.service.interface';
import { ImageFileValidationService, UnavailableMalwareScanner } from './security/image-file-validation.service';
import { UploadAuthorizationGuard } from './security/upload-authorization.guard';

@Module({
  providers: [S3ClientProvider, ImageFileValidationService, UnavailableMalwareScanner, UploadAuthorizationGuard, ImageUploadService, { provide: IImageUploadServiceToken, useExisting: ImageUploadService }],
  controllers: [ImageUploadController],
  exports: [IImageUploadServiceToken],
})
export class ImageUploadModule { }
