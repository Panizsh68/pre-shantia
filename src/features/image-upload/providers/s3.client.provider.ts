import { Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { IMAGE_UPLOAD_TOKEN } from '../constants/image-upload.constants';

export const S3ClientProvider: Provider = {
  provide: IMAGE_UPLOAD_TOKEN.S3_CLIENT,
  useFactory: () => {
    const endpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY || process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretAccessKey = process.env.R2_SECRET_KEY || process.env.CLOUDFLARE_R2_SECRET_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 S3 credentials or endpoint are not configured');
    }
    return new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });
  },
};
