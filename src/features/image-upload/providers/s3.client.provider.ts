import { Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { IMAGE_UPLOAD_TOKEN } from '../constants/image-upload.constants';

export const S3ClientProvider: Provider = {
  provide: IMAGE_UPLOAD_TOKEN.S3_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const r2Config = configService.get('config.r2');
    const endpoint = r2Config?.endpoint;
    const accessKeyId = r2Config?.accessKey;
    const secretAccessKey = r2Config?.secretKey;

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
