import { Inject, Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { IMAGE_UPLOAD_TOKEN, DEFAULTS } from './constants/image-upload.constants';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreatePresignDto, ImageMetaDto } from './dto/create-presign.dto';
import { CreatePresignResponseDto, PresignItemDto } from './dto/presign-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageUploadService {
  private bucket: string;
  private publicBaseUrl?: string;

  constructor(@Inject(IMAGE_UPLOAD_TOKEN.S3_CLIENT) private readonly s3: S3Client | null) {
    this.bucket = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET || '';
    this.publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
    // do not throw here to allow app to boot in non-R2 environments; validate when used
  }

  async createPresignedUrls(dto: CreatePresignDto): Promise<CreatePresignResponseDto> {
    if (!this.s3) {
      throw new InternalServerErrorException('R2 S3 client is not configured. Please set R2 endpoint and credentials.');
    }
    if (!this.bucket) {
      throw new InternalServerErrorException('R2 bucket is not configured (R2_BUCKET)');
    }
    this.validateDto(dto);

    const items: PresignItemDto[] = [];

    for (const file of dto.files) {
      this.validateFileSize(file);
      const key = this.buildKey(dto.type, file.filename);
      const presignedUrl = await this.getPresignedPutUrl(key, file.contentType);
      const publicUrl = this.buildPublicUrl(key);
      items.push({ filename: file.filename, contentType: file.contentType, presignedUrl, publicUrl });
    }

    return { items };
  }

  private validateDto(dto: CreatePresignDto) {
    const count = dto.files?.length || 0;
    if (dto.type === 'product' && count > DEFAULTS.MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(`Product images cannot exceed ${DEFAULTS.MAX_PRODUCT_IMAGES}`);
    }
    if (dto.type === 'company' && count > DEFAULTS.MAX_COMPANY_IMAGES) {
      throw new BadRequestException(`Company image must be at most ${DEFAULTS.MAX_COMPANY_IMAGES}`);
    }
  }

  private validateFileSize(file: ImageMetaDto) {
    if (file.size > DEFAULTS.MAX_IMAGE_BYTES) {
      throw new BadRequestException(`File ${file.filename} exceeds maximum size of ${DEFAULTS.MAX_IMAGE_BYTES} bytes`);
    }
  }

  private buildKey(type: string, filename: string) {
    const id = uuidv4();
    // store under type/<uuid>_<sanitizedFilename>
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${type}/${id}_${safe}`;
  }

  private buildPublicUrl(key: string) {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    // fallback to S3-style URL using endpoint if available
    // Note: endpoint might include protocol and host
    const s3 = this.s3!; // asserted non-null by caller checks
    const endpointCandidate = (s3.config && (s3.config as any).endpoint) || undefined;
    let endpoint = '';
    if (endpointCandidate) {
      if (typeof endpointCandidate === 'string') endpoint = endpointCandidate;
      else if (typeof endpointCandidate === 'object' && (endpointCandidate as any).href) endpoint = (endpointCandidate as any).href;
      else endpoint = String(endpointCandidate);
    }
    if (endpoint) {
      // try to craft URL: endpoint/bucket/key
      return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }
    // Last resort: key only
    return key;
  }

  private async getPresignedPutUrl(key: string, contentType: string) {
    try {
      const s3 = this.s3!;
      const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
      const url = await getSignedUrl(s3, command, { expiresIn: DEFAULTS.PRESIGN_EXPIRES_SECONDS });
      return url;
    } catch (err) {
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }
}
