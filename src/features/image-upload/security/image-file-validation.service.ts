import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export interface ValidatedImage {
  buffer: Buffer;
  contentType: AllowedImageType;
  width: number;
  height: number;
}

export interface MalwareScanResult {
  status: 'unavailable' | 'clean';
}

export interface MalwareScanner {
  scan(buffer: Buffer): Promise<MalwareScanResult>;
}

/** Explicit no-op adapter. It reports that no scanner is connected. */
@Injectable()
export class UnavailableMalwareScanner implements MalwareScanner {
  async scan(_buffer: Buffer): Promise<MalwareScanResult> {
    return { status: 'unavailable' };
  }
}

@Injectable()
export class ImageFileValidationService {
  readonly maxDimension = 8_000;
  readonly maxPixels = 40_000_000;

  async validateAndNormalize(buffer: Buffer, declaredType?: string): Promise<ValidatedImage> {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new BadRequestException('Invalid image file');
    }

    const detectedType = this.detectType(buffer);
    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType)) {
      throw new BadRequestException('Unsupported image format');
    }
    if (declaredType !== detectedType) {
      throw new BadRequestException('Image content type does not match its contents');
    }
    this.rejectTrailingPolyglotData(buffer, detectedType);

    try {
      const image = sharp(buffer, { failOn: 'error', limitInputPixels: this.maxPixels });
      const metadata = await image.metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      if (!width || !height || width > this.maxDimension || height > this.maxDimension || width * height > this.maxPixels) {
        throw new BadRequestException('Image dimensions exceed the permitted limit');
      }

      // Decode and re-encode without preserving source metadata.
      const normalized = await image.rotate().toFormat(this.formatFor(detectedType)).toBuffer();
      return { buffer: normalized, contentType: detectedType, width, height };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Malformed or unsupported image');
    }
  }

  private detectType(buffer: Buffer): AllowedImageType | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return 'image/png';
    }
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
    return null;
  }

  private rejectTrailingPolyglotData(buffer: Buffer, type: AllowedImageType): void {
    if (type === 'image/jpeg') {
      const end = buffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
      if (end < 0 || buffer.subarray(end + 2).some(byte => ![0x00, 0x09, 0x0a, 0x0d, 0x20].includes(byte))) {
        throw new BadRequestException('Malformed image');
      }
    }
    if (type === 'image/png') {
      const end = buffer.lastIndexOf(Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]));
      if (end < 0 || buffer.subarray(end + 8).some(byte => ![0x00, 0x09, 0x0a, 0x0d, 0x20].includes(byte))) {
        throw new BadRequestException('Malformed image');
      }
    }
    if (type === 'image/webp' && buffer.length >= 8 && buffer.readUInt32LE(4) + 8 !== buffer.length) {
      throw new BadRequestException('Malformed image');
    }
  }

  private formatFor(type: AllowedImageType): 'jpeg' | 'png' | 'webp' {
    return type.slice(6) as 'jpeg' | 'png' | 'webp';
  }
}
