import { BadRequestException } from '@nestjs/common';
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
});
