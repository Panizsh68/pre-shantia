import { Inject, Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMAGE_UPLOAD_TOKEN, DEFAULTS } from './constants/image-upload.constants';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreatePresignDto, ImageMetaDto } from './dto/create-presign.dto';
import { CreatePresignResponseDto, PresignItemDto } from './dto/presign-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);
  private bucket: string;
  private publicBaseUrl?: string;
  private maxImageBytes: number;
  private presignExpiresSeconds: number;
  private maxProductImages: number;
  private maxCompanyImages: number;

  constructor(
    @Inject(IMAGE_UPLOAD_TOKEN.S3_CLIENT) private readonly s3: S3Client | null,
    private readonly configService: ConfigService,
  ) {
    const r2Config = this.configService.get('config.r2');
    this.logger.log(`[constructor] Loading R2 config...`);
    this.logger.debug(`[constructor] r2Config: ${r2Config ? 'found' : 'not found'}`);

    this.bucket = r2Config?.bucket || '';
    this.publicBaseUrl = r2Config?.publicBaseUrl;

    this.logger.log(`[constructor] bucket=${this.bucket || 'EMPTY'}, publicBaseUrl=${this.publicBaseUrl || 'EMPTY'}`);
    this.logger.log(`[constructor] s3Client available: ${this.s3 ? 'YES' : 'NO'}`);

    // Load configurable limits from env or use defaults
    this.maxImageBytes = parseInt(process.env.MAX_IMAGE_BYTES || String(DEFAULTS.MAX_IMAGE_BYTES), 10);
    this.presignExpiresSeconds = parseInt(process.env.PRESIGN_EXPIRES_SECONDS || String(DEFAULTS.PRESIGN_EXPIRES_SECONDS), 10);
    this.maxProductImages = parseInt(process.env.MAX_PRODUCT_IMAGES || String(DEFAULTS.MAX_PRODUCT_IMAGES), 10);
    this.maxCompanyImages = parseInt(process.env.MAX_COMPANY_IMAGES || String(DEFAULTS.MAX_COMPANY_IMAGES), 10);

    this.logger.log(`[constructor] Limits: maxImageBytes=${this.maxImageBytes}, presignSeconds=${this.presignExpiresSeconds}, maxProduct=${this.maxProductImages}, maxCompany=${this.maxCompanyImages}`);
    // do not throw here to allow app to boot in non-R2 environments; validate when used
  }

  async createPresignedUrls(dto: CreatePresignDto): Promise<CreatePresignResponseDto> {
    this.logger.log(`[createPresignedUrls] ENTRY: type=${dto.type} fileCount=${dto.files?.length || 0}`);

    if (!this.s3) {
      this.logger.error('[createPresignedUrls] FAIL: R2 S3 client is null - S3ClientProvider did not initialize client');
      this.logger.error(`[createPresignedUrls] DIAGNOSTIC: bucket=${this.bucket || 'EMPTY'}, publicBaseUrl=${this.publicBaseUrl || 'EMPTY'}`);
      throw new InternalServerErrorException('R2 S3 client is not configured. Please set R2 endpoint and credentials.');
    }

    if (!this.bucket) {
      this.logger.error('[createPresignedUrls] FAIL: R2 bucket is empty');
      throw new InternalServerErrorException('R2 bucket is not configured (R2_BUCKET)');
    }

    this.logger.log(`[createPresignedUrls] S3 client ready, bucket=${this.bucket}`);
    this.validateDto(dto);

    const items: PresignItemDto[] = [];

    for (const file of dto.files) {
      this.logger.log(`[createPresignedUrls] Processing file: ${file.filename} (${file.size} bytes, ${file.contentType})`);
      this.validateFileSize(file);
      const key = this.buildKey(dto.type, file.filename);
      this.logger.debug(`[createPresignedUrls] Built key: ${key}`);
      const presignedUrl = await this.getPresignedPutUrl(key, file.contentType);
      const publicUrl = this.buildPublicUrl(key);
      this.logger.debug(`[createPresignedUrls] Presigned URL generated, public URL: ${publicUrl}`);
      items.push({ filename: file.filename, contentType: file.contentType, presignedUrl, publicUrl });
    }

    this.logger.log(`[createPresignedUrls] SUCCESS: Generated ${items.length} presigned URLs`);
    return { items };
  }

  private validateDto(dto: CreatePresignDto) {
    const count = dto.files?.length || 0;
    if (dto.type === 'product' && count > this.maxProductImages) {
      this.logger.warn(`[validateDto] product image count ${count} exceeds limit ${this.maxProductImages}`);
      throw new BadRequestException(`Product images cannot exceed ${this.maxProductImages}`);
    }
    if (dto.type === 'company' && count > this.maxCompanyImages) {
      this.logger.warn(`[validateDto] company image count ${count} exceeds limit ${this.maxCompanyImages}`);
      throw new BadRequestException(`Company image must be at most ${this.maxCompanyImages}`);
    }
  }

  private validateFileSize(file: ImageMetaDto) {
    if (file.size > this.maxImageBytes) {
      this.logger.warn(`[validateFileSize] file ${file.filename} size ${file.size} exceeds limit ${this.maxImageBytes}`);
      throw new BadRequestException(`File ${file.filename} exceeds maximum size of ${this.maxImageBytes} bytes`);
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
    if (!this.s3) {
      this.logger.warn('[buildPublicUrl] s3 client is null, returning key only');
      return key;
    }
    const endpointCandidate = (this.s3.config && (this.s3.config as any).endpoint) || undefined;
    let endpoint = '';
    if (endpointCandidate) {
      if (typeof endpointCandidate === 'string') { endpoint = endpointCandidate; }
      else if (typeof endpointCandidate === 'object' && (endpointCandidate as any).href) { endpoint = (endpointCandidate as any).href; }
      else { endpoint = String(endpointCandidate); }
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
      if (!this.s3) {
        this.logger.error('[getPresignedPutUrl] s3 client is null');
        throw new InternalServerErrorException('S3 client is not available');
      }
      const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
      const url = await getSignedUrl(this.s3, command, { expiresIn: this.presignExpiresSeconds });
      this.logger.debug(`[getPresignedPutUrl] presigned url generated for key=${key}`);
      return url;
    } catch (err) {
      this.logger.error(`[getPresignedPutUrl] failed to generate presigned URL: ${err instanceof Error ? err.message : String(err)}`);
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }
}
