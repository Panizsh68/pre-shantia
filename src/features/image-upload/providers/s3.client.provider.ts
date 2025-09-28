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
      // Don't throw during bootstrap — return null so app can start in environments without R2 configured.
      // Methods that require R2 will validate and throw an informative error at call time.
      return null;
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
