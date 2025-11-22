import { CreatePresignDto } from '../dto/create-presign.dto';
import { CreatePresignResponseDto } from '../dto/presign-response.dto';

export const IImageUploadServiceToken = 'IImageUploadService';

export interface IImageUploadService {
  createPresignedUrls(dto: CreatePresignDto): Promise<CreatePresignResponseDto>;
  uploadFiles(files: Express.Multer.File[], type: 'product' | 'company'):
    Promise<CreatePresignResponseDto>;
}
