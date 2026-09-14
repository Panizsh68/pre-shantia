import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { ImageFileValidationService, UnavailableMalwareScanner } from './security/image-file-validation.service';

describe('ImageUploadService upload limits and object keys', () => {
  const service = new ImageUploadService(
    null,
    { get: () => ({ bucket: 'private-test-bucket', publicBaseUrl: '' }) } as any,
    new ImageFileValidationService(),
    new UnavailableMalwareScanner(),
  );

  it('rejects oversized metadata before generating a storage key', () => {
    expect(() => (service as any).validateFileSize({ filename: 'x.png', contentType: 'image/png', size: 10 * 1024 * 1024 + 1 })).toThrow(BadRequestException);
  });

  it('generates a server-owned, traversal-safe, collision-resistant key', () => {
    const key = (service as any).buildKey('product', '../../overwrite.png');
    expect(key).toMatch(/^product\/[0-9a-f-]+_/);
    expect(key).not.toContain('/../');
    expect(key).toContain('.._.._overwrite.png');
    expect((service as any).buildKey('product', '../../overwrite.png')).not.toBe(key);
  });

  it('preserves image validation errors as client errors', async () => {
    const validator = {
      validateAndNormalize: jest.fn().mockRejectedValue(new BadRequestException('Invalid image')),
    };
    const productionService = new ImageUploadService(
      { send: jest.fn() } as any,
      { get: (key: string) => key === 'config.r2'
        ? { bucket: 'private-test-bucket', publicBaseUrl: '' }
        : key === 'NODE_ENV' ? 'production' : undefined } as any,
      validator as any,
      new UnavailableMalwareScanner(),
    );

    await expect(productionService.uploadFiles([
      { originalname: 'logo.png', mimetype: 'image/png', size: 1, buffer: Buffer.from('x') },
    ] as any, 'company')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps storage provider failures to a safe service-unavailable response', async () => {
    const productionService = new ImageUploadService(
      { send: jest.fn().mockRejectedValue(new Error('Access Denied')) } as any,
      { get: (key: string) => key === 'config.r2'
        ? { bucket: 'private-test-bucket', publicBaseUrl: '' }
        : key === 'NODE_ENV' ? 'production' : undefined } as any,
      { validateAndNormalize: jest.fn().mockResolvedValue({ buffer: Buffer.from('x'), contentType: 'image/png' }) } as any,
      { scan: jest.fn().mockResolvedValue({ status: 'unavailable' }) } as any,
    );

    await expect(productionService.uploadFiles([
      { originalname: 'logo.png', mimetype: 'image/png', size: 1, buffer: Buffer.from('x') },
    ] as any, 'company')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('uses local disk storage in production when explicitly enabled', async () => {
    const productionService = new ImageUploadService(
      null,
      { get: (key: string) => key === 'config.r2'
        ? { bucket: '', publicBaseUrl: '' }
        : key === 'NODE_ENV' ? 'production'
          : key === 'LOCAL_UPLOAD_ENABLED' ? true : undefined } as any,
      { validateAndNormalize: jest.fn().mockResolvedValue({ buffer: Buffer.from('x'), contentType: 'image/png' }) } as any,
      { scan: jest.fn().mockResolvedValue({ status: 'unavailable' }) } as any,
    );
    const saveLocally = jest.spyOn(productionService as any, 'saveLocally').mockResolvedValue(undefined);

    const result = await productionService.uploadFiles([
      { originalname: 'logo.png', mimetype: 'image/png', size: 1, buffer: Buffer.from('x') },
    ] as any, 'company');

    expect(saveLocally).toHaveBeenCalledTimes(1);
    expect(result.items[0].publicUrl).toContain('/uploads/company/');
  });
});
