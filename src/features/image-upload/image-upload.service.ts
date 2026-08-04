/* global Express */
import { Inject, Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { RedactingLogger } from 'src/infrastructure/logging/redacting-logger';
import { ConfigService } from '@nestjs/config';
import { IMAGE_UPLOAD_TOKEN, DEFAULTS } from './constants/image-upload.constants';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreatePresignDto, ImageMetaDto } from './dto/create-presign.dto';
import { CreatePresignResponseDto, PresignItemDto } from './dto/presign-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { ImageFileValidationService, UnavailableMalwareScanner } from './security/image-file-validation.service';

@Injectable()
export class ImageUploadService {
  private readonly logger = new RedactingLogger(ImageUploadService.name);
  private bucket: string;
  private publicBaseUrl?: string;
  private maxImageBytes: number;
  private presignExpiresSeconds: number;
  private maxProductImages: number;
  private maxCompanyImages: number;
  private readonly localUploadEnabled: boolean;
  private readonly appUrl: string;

  constructor(
    @Inject(IMAGE_UPLOAD_TOKEN.S3_CLIENT) private readonly s3: S3Client | null,
    private readonly configService: ConfigService,
    private readonly imageValidator: ImageFileValidationService,
    private readonly malwareScanner: UnavailableMalwareScanner,
  ) {
    const r2Config = this.configService.get('config.r2');
    this.logger.log(`[constructor] Loading R2 config...`);
    this.logger.debug(`[constructor] r2Config: ${r2Config ? 'found' : 'not found'}`);

    this.bucket = r2Config?.bucket || '';
    this.publicBaseUrl = r2Config?.publicBaseUrl;
    this.localUploadEnabled = this.configService.get<string>('NODE_ENV') !== 'production' && !this.s3;
    this.appUrl = (this.configService.get<string>('APP_URL') || 'http://localhost:3001').replace(/\/$/, '');

    this.logger.log(`[constructor] bucket=${this.bucket || 'EMPTY'}, publicBaseUrl=${this.publicBaseUrl || 'EMPTY'}`);
    this.logger.log(`[constructor] s3Client available: ${this.s3 ? 'YES' : 'NO'}`);

    // Load configurable limits from env or use defaults
    this.maxImageBytes = parseInt(process.env.MAX_IMAGE_BYTES || String(DEFAULTS.MAX_IMAGE_BYTES), 10);
    this.presignExpiresSeconds = parseInt(process.env.PRESIGN_EXPIRES_SECONDS || String(DEFAULTS.PRESIGN_EXPIRES_SECONDS), 10);
    this.maxProductImages = parseInt(process.env.MAX_PRODUCT_IMAGES || String(DEFAULTS.MAX_PRODUCT_IMAGES), 10);
    this.maxCompanyImages = parseInt(process.env.MAX_COMPANY_IMAGES || String(DEFAULTS.MAX_COMPANY_IMAGES), 10);

    this.logger.log(`[constructor] Limits: maxImageBytes=${this.maxImageBytes}, presignSeconds=${this.presignExpiresSeconds}, maxProduct=${this.maxProductImages}, maxCompany=${this.maxCompanyImages}`);
  }

  async createPresignedUrls(dto: CreatePresignDto): Promise<CreatePresignResponseDto> {
    this.logger.log(`[createPresignedUrls] ENTRY: type=${dto.type} fileCount=${dto.files?.length || 0}`);

    if (!this.s3 && !this.localUploadEnabled) {
      this.logger.error('[createPresignedUrls] FAIL: R2 S3 client is null');
      throw new InternalServerErrorException('R2 S3 client is not configured. Please set R2 endpoint and credentials.');
    }

    if (!this.bucket && !this.localUploadEnabled) {
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
      if (this.localUploadEnabled) {
        items.push({ filename: file.filename, contentType: file.contentType, presignedUrl: null, publicUrl: this.buildLocalPublicUrl(key) });
        continue;
      }
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
    if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > this.maxImageBytes) {
      this.logger.warn(`[validateFileSize] file ${file.filename} size ${file.size} exceeds limit ${this.maxImageBytes}`);
      throw new BadRequestException(`File ${file.filename} exceeds maximum size of ${this.maxImageBytes} bytes`);
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.contentType)) {
      throw new BadRequestException('Unsupported image format');
    }
  }

  private buildKey(type: string, filename: string) {
    const id = uuidv4();
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${type}/${id}_${safe}`;
  }

  /**
   * D1 Fix: Build robust, secure public URLs for assets.
   * Ensures HTTPS for external domains to prevent Mixed Content errors.
   */
  private buildPublicUrl(key: string) {
    if (this.localUploadEnabled) return this.buildLocalPublicUrl(key);
    if (this.publicBaseUrl) {
      let baseUrl = this.publicBaseUrl.replace(/\/$/, '');
      // Ensure HTTPS if protocol is missing and it's not a local test
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      return `${baseUrl}/${key}`;
    }

    if (!this.s3) {
      this.logger.warn('[buildPublicUrl] s3 client is null, returning key only');
      return key;
    }

    const endpointCandidate = (this.s3.config as any)?.endpoint;
    let endpoint = '';
    
    if (typeof endpointCandidate === 'string') {
      endpoint = endpointCandidate;
    } else if (typeof endpointCandidate === 'object' && endpointCandidate?.href) {
      endpoint = endpointCandidate.href;
    } else if (endpointCandidate) {
      endpoint = String(endpointCandidate);
    }

    if (endpoint) {
      let publicEndpoint = endpoint.replace(/\/$/, '');
      
      // Force HTTPS for non-local endpoints to prevent mixed content issues
      const isLocal = publicEndpoint.includes('localhost') || publicEndpoint.includes('127.0.0.1');
      if (publicEndpoint.startsWith('http://') && !isLocal) {
        publicEndpoint = publicEndpoint.replace('http://', 'https://');
      } else if (!publicEndpoint.startsWith('http') && !isLocal) {
        publicEndpoint = `https://${publicEndpoint}`;
      }

      return `${publicEndpoint}/${this.bucket}/${key}`;
    }

    return key;
  }

  private buildLocalPublicUrl(key: string): string {
    return `${this.appUrl}/uploads/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  private async saveLocally(key: string, buffer: Buffer): Promise<void> {
    const root = path.resolve(process.cwd(), 'uploads');
    const target = path.resolve(root, key);
    if (!target.startsWith(`${root}${path.sep}`)) throw new BadRequestException('Invalid upload path');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer, { flag: 'wx' });
  }

  private async getPresignedPutUrl(key: string, contentType: string) {
    try {
      if (!this.s3) {
        this.logger.error('[getPresignedPutUrl] s3 client is null');
        throw new InternalServerErrorException('S3 client is not available');
      }
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });
      let url = await getSignedUrl(this.s3, command, { expiresIn: this.presignExpiresSeconds });

      const checksumParams = [
        'x-amz-checksum-crc32',
        'x-amz-checksum-sha1',
        'x-amz-checksum-sha256',
        'x-amz-checksum-crc32c',
        'x-amz-sdk-checksum-algorithm',
      ];

      for (const param of checksumParams) {
        url = url.replace(new RegExp(`&${param}=[^&]*`, 'g'), '');
        url = url.replace(new RegExp(`\\?${param}=[^&]*&`, 'g'), '?');
      }

      this.logger.debug(`[getPresignedPutUrl] presigned url generated for key=${key} (checksum params removed)`);
      return url;
    } catch (err) {
      this.logger.error(`[getPresignedPutUrl] failed to generate presigned URL: ${err instanceof Error ? err.message : String(err)}`);
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }

  async uploadFiles(files: Express.Multer.File[], type: 'product' | 'company'): Promise<CreatePresignResponseDto> {
    this.logger.log(`[uploadFiles] ENTRY: type=${type} fileCount=${files.length}`);

    if (!this.s3 && !this.localUploadEnabled) {
      this.logger.error('[uploadFiles] FAIL: R2 S3 client is null');
      throw new InternalServerErrorException('R2 S3 client is not configured. Please set R2 endpoint and credentials.');
    }

    if (!this.bucket && !this.localUploadEnabled) {
      this.logger.error('[uploadFiles] FAIL: R2 bucket is empty');
      throw new InternalServerErrorException('R2 bucket is not configured (R2_BUCKET)');
    }

    this.logger.log(`[uploadFiles] S3 client ready, bucket=${this.bucket}`);

    const maxImages = type === 'product' ? this.maxProductImages : this.maxCompanyImages;
    if (files.length > maxImages) {
      this.logger.warn(`[uploadFiles] file count ${files.length} exceeds limit ${maxImages}`);
      throw new BadRequestException(`Maximum ${maxImages} file(s) allowed for ${type}`);
    }

    const items: PresignItemDto[] = [];

    for (const file of files) {
      this.logger.log(`[uploadFiles] Processing file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

      if (file.size > this.maxImageBytes) {
        this.logger.warn(`[uploadFiles] file ${file.originalname} size ${file.size} exceeds limit ${this.maxImageBytes}`);
        throw new BadRequestException(`File ${file.originalname} exceeds maximum size of ${this.maxImageBytes} bytes`);
      }

      try {
        const normalized = await this.imageValidator.validateAndNormalize(file.buffer, file.mimetype);
        await this.malwareScanner.scan(normalized.buffer);
        const key = this.buildKey(type, file.originalname);
        this.logger.debug(`[uploadFiles] Built key: ${key}`);

        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: normalized.buffer,
          ContentType: normalized.contentType,
        });

        if (this.localUploadEnabled) {
          await this.saveLocally(key, normalized.buffer);
        } else {
          await this.s3!.send(command);
        }
        const publicUrl = this.buildPublicUrl(key);

        items.push({
          filename: file.originalname,
          contentType: normalized.contentType,
          publicUrl,
          presignedUrl: '',
        });
      } catch (err) {
        this.logger.error(`[uploadFiles] Upload failed for ${file.originalname}: ${err instanceof Error ? err.message : String(err)}`);
        throw new InternalServerErrorException(`Failed to upload file ${file.originalname}`);
      }
    }

    this.logger.log(`[uploadFiles] SUCCESS: Uploaded ${items.length} file(s)`);
    return { items };
  }
}
