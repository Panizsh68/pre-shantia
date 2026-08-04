import sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';
import { ImageFileValidationService } from './image-file-validation.service';

describe('ImageFileValidationService', () => {
  const service = new ImageFileValidationService();

  async function png(width = 2, height = 2): Promise<Buffer> {
    return sharp({ create: { width, height, channels: 3, background: { r: 10, g: 20, b: 30 } } }).png().toBuffer();
  }

  it('accepts a real PNG and strips metadata by re-encoding', async () => {
    const result = await service.validateAndNormalize(await png(), 'image/png');
    expect(result.contentType).toBe('image/png');
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect((await sharp(result.buffer).metadata()).format).toBe('png');
  });

  it.each([
    ['fake extension', Buffer.from('not an image'), 'image/png'],
    ['invalid magic bytes', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'image/png'],
    ['SVG', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/svg+xml'],
  ])('rejects %s', async (_name, buffer, type) => {
    await expect(service.validateAndNormalize(buffer, type)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a PNG with appended polyglot data', async () => {
    await expect(service.validateAndNormalize(Buffer.concat([await png(), Buffer.from('<script>')]), 'image/png')).rejects.toThrow('Malformed image');
  });

  it('rejects excessive dimensions', async () => {
    await expect(service.validateAndNormalize(await png(8001, 1), 'image/png')).rejects.toThrow('dimensions');
  });
});
